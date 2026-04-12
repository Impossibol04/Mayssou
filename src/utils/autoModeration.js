const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('./guildConfig');

/** @type {Map<string, number[]>} key guildId:userId -> timestamps (débit messages) */
const recentMsgs = new Map();

/** @type {Map<string, { t: number; norm: string }[]>} doublons de texte récents */
const recentTexts = new Map();

/**
 * Insultes / grossièretés fortes (correspondance **mot entier** uniquement, sans sous-chaîne type « dominique »).
 */
const BAD_TOKENS = new Set([
    'connard',
    'connasse',
    'connards',
    'connasses',
    'fdp',
    'pd',
    'encule',
    'enculer',
    'enculé',
    'ntm',
    'nique',
    'niquer',
    'niqué',
    'salope',
    'salopes',
    'pute',
    'putes',
    'tg',
    'hitler',
    'nazi',
    'negre',
    'negres',
    'négre',
    'nègre',
    'bouffon',
    'bouffonne',
    'tarlouze',
    'pédale',
    'pedale',
    'pédé',
    'pede',
    'tapette',
    'putain',
    'putains',
    'batard',
    'bâtard',
    'batards',
    'salaud',
    'salauds',
    'trouducul',
    'trouduc',
]);

/** Sous-chaînes uniquement sur forme compacte (sans espaces), 3 caractères max pour limiter les faux positifs */
const BAD_COMPACT = new Set(['fdp', 'ntm', 'tg']);

function getSettings(guildId) {
    const cfg = getGuildConfig(guildId);
    const a = cfg.autoMod && typeof cfg.autoMod === 'object' ? cfg.autoMod : {};
    return {
        enabled: Boolean(a.enabled),
        /** Par défaut : activé (sauf si `insults: false` explicitement) */
        insults: a.insults !== false,
        spam: a.spam !== false,
        caps: a.caps !== false,
        capsMinLen: typeof a.capsMinLen === 'number' ? a.capsMinLen : 18,
        capsRatio: typeof a.capsRatio === 'number' ? a.capsRatio : 0.72,
        capsMinLetters: typeof a.capsMinLetters === 'number' ? a.capsMinLetters : 8,
        spamWindowMs: typeof a.spamWindowMs === 'number' ? a.spamWindowMs : 8000,
        spamMax: typeof a.spamMax === 'number' ? a.spamMax : 6,
        spamDupWindowMs: typeof a.spamDupWindowMs === 'number' ? a.spamDupWindowMs : 12000,
        spamDupCount: typeof a.spamDupCount === 'number' ? a.spamDupCount : 3,
        spamRepeatChar: typeof a.spamRepeatChar === 'number' ? a.spamRepeatChar : 15,
        blockInvites: Boolean(a.blockInvites),
        /** Tout lien http(s), www., aperçu embed, et/ou GIF en pièce jointe (style DraftBot) */
        blockLinks: Boolean(a.blockLinks),
        blockGifFiles: a.blockGifFiles !== false,
    };
}

function tokenizeWords(content) {
    return String(content || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(/[^a-z0-9]+/)
        .map((w) => w.replace(/[^a-z0-9]/gi, ''))
        .filter(Boolean);
}

function hasInsult(content) {
    const raw = String(content || '');
    if (!raw.trim()) return false;

    const tokens = tokenizeWords(raw);
    for (const w of tokens) {
        const t = w
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/gi, '');
        if (BAD_TOKENS.has(t)) return true;
    }

    const compact = raw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
    for (const bad of BAD_COMPACT) {
        if (compact.includes(bad)) return true;
    }

    return false;
}

function capsRatio(content, minLetters) {
    const letters = String(content).replace(/[^a-zA-ZàâäéèêëïîôùûçÀÂÄÉÈÊËÏÎÔÙÛÇ]/g, '');
    if (letters.length < minLetters) return 0;
    const up = letters.replace(/[^A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ]/g, '').length;
    return up / letters.length;
}

function isDiscordInvite(content) {
    return /discord\.gg\/[\w-]+/i.test(content) || /discord(?:app)?\.com\/invite\//i.test(content);
}

/** Détecte une URL dans le texte : http(s) ou www. (évite les faux positifs type « mot.com » sans lien réel) */
function hasUrlInText(content) {
    const s = String(content || '');
    if (/https?:\/\//i.test(s)) return true;
    if (/\bwww\.[a-z0-9][a-z0-9.-]*\.[a-z]{2,}\b/i.test(s)) return true;
    return false;
}

function embedHasExternalUrl(message) {
    for (const e of message.embeds || []) {
        const u = e.url;
        if (u && /^https?:\/\//i.test(String(u))) return true;
    }
    return false;
}

function hasGifAttachment(message) {
    if (!message.attachments?.size) return false;
    for (const a of message.attachments.values()) {
        const ct = (a.contentType || '').toLowerCase();
        const name = (a.name || '').toLowerCase();
        const url = (a.url || '').toLowerCase();
        if (ct === 'image/gif' || ct.includes('gif')) return true;
        if (name.endsWith('.gif') || /\.gif(\?|#|$)/i.test(url)) return true;
    }
    return false;
}

function shouldBlockLinks(s, message, content) {
    if (!s.blockLinks) return false;
    if (hasUrlInText(content)) return true;
    if (embedHasExternalUrl(message)) return true;
    if (s.blockGifFiles && hasGifAttachment(message)) return true;
    return false;
}

function spamRateHit(guildId, userId, windowMs, max) {
    const key = `${guildId}:${userId}`;
    const now = Date.now();
    let arr = recentMsgs.get(key) || [];
    arr = arr.filter((t) => now - t <= windowMs);
    arr.push(now);
    recentMsgs.set(key, arr);
    return arr.length >= max;
}

function spamDuplicateHit(guildId, userId, content, windowMs, needCount) {
    const norm = String(content || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
    if (norm.length < 8) return false;

    const key = `${guildId}:${userId}`;
    const now = Date.now();
    let arr = recentTexts.get(key) || [];
    arr = arr.filter((e) => now - e.t <= windowMs);
    arr.push({ t: now, norm });
    recentTexts.set(key, arr);
    const same = arr.filter((e) => e.norm === norm).length;
    return same >= needCount;
}

function hasRepeatCharSpam(content, minRepeat) {
    return new RegExp(`(.)\\1{${minRepeat - 1},}`, 'u').test(String(content || ''));
}

function canBypass(member) {
    if (!member) return false;
    return (
        member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.permissions.has(PermissionFlagsBits.ModerateMembers)
    );
}

async function notifyChannel(message, text) {
    await message.channel
        .send({
            content: text,
            allowedMentions: { users: [message.author.id] },
        })
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5500))
        .catch(() => {});
}

/**
 * @returns {Promise<string | null>} raison courte si action, sinon null
 */
async function runAutoModeration(message) {
    if (!message.guild || message.author.bot) return null;
    if (canBypass(message.member)) return null;

    const s = getSettings(message.guild.id);
    if (!s.enabled) return null;

    const content = message.content || '';
    const author = message.author;

    if (s.blockInvites && isDiscordInvite(content)) {
        await message.delete().catch(() => {});
        await notifyChannel(message, `🚫 ${author}, les invitations Discord sont interdites ici.`);
        return 'invite';
    }

    if (shouldBlockLinks(s, message, content)) {
        await message.delete().catch(() => {});
        await notifyChannel(
            message,
            `🔗 ${author}, les liens et les GIF envoyés en fichier ne sont pas autorisés dans ce salon.`
        );
        return 'links';
    }

    if (s.insults && content.length > 0 && hasInsult(content)) {
        await message.delete().catch(() => {});
        await notifyChannel(message, `⚠️ ${author}, ce langage n’est pas accepté ici.`);
        return 'insulte';
    }

    if (
        s.caps &&
        content.length >= s.capsMinLen &&
        capsRatio(content, s.capsMinLetters) >= s.capsRatio
    ) {
        await message.delete().catch(() => {});
        await notifyChannel(message, `🔇 ${author}, trop de majuscules — reformule calmement.`);
        return 'caps';
    }

    if (s.spam && content.length > 0 && hasRepeatCharSpam(content, s.spamRepeatChar)) {
        await message.delete().catch(() => {});
        await notifyChannel(message, `📛 ${author}, répétitions excessives (spam).`);
        return 'spam_repeat';
    }

    if (
        s.spam &&
        spamDuplicateHit(message.guild.id, author.id, content, s.spamDupWindowMs, s.spamDupCount)
    ) {
        await message.delete().catch(() => {});
        await notifyChannel(message, `🔁 ${author}, ne répète pas le même message.`);
        return 'spam_duplicate';
    }

    if (s.spam && spamRateHit(message.guild.id, author.id, s.spamWindowMs, s.spamMax)) {
        await message.delete().catch(() => {});
        await notifyChannel(message, `⏳ ${author}, tu envoies trop de messages. Ralentis un peu.`);
        return 'spam_rate';
    }

    return null;
}

module.exports = { runAutoModeration, getSettings };
