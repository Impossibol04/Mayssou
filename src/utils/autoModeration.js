const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('./guildConfig');

/** @type {Map<string, number[]>} key guildId:userId -> timestamps */
const recentMsgs = new Map();

const DEFAULT_BAD = new Set([
    'fdp',
    'pd',
    'encule',
    'ntm',
    'tg',
    'salope',
    'pute',
    'connard',
    'connasse',
    'nique',
    'hitler',
]);

function getSettings(guildId) {
    const cfg = getGuildConfig(guildId);
    const a = cfg.autoMod && typeof cfg.autoMod === 'object' ? cfg.autoMod : {};
    return {
        enabled: Boolean(a.enabled),
        insults: a.insults === true,
        spam: a.spam !== false,
        caps: a.caps !== false,
        capsMinLen: typeof a.capsMinLen === 'number' ? a.capsMinLen : 18,
        capsRatio: typeof a.capsRatio === 'number' ? a.capsRatio : 0.72,
        spamWindowMs: typeof a.spamWindowMs === 'number' ? a.spamWindowMs : 8000,
        spamMax: typeof a.spamMax === 'number' ? a.spamMax : 6,
        blockInvites: Boolean(a.blockInvites),
    };
}

function normalizeWord(w) {
    return w
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9@]/gi, '');
}

function hasInsult(content) {
    const words = content.split(/\s+/).map(normalizeWord).filter(Boolean);
    for (const w of words) {
        if (DEFAULT_BAD.has(w)) return true;
        for (const bad of DEFAULT_BAD) {
            if (w.includes(bad) && bad.length >= 3) return true;
        }
    }
    return false;
}

function capsRatio(content) {
    const letters = content.replace(/[^a-zA-ZàâäéèêëïîôùûçÀÂÄÉÈÊËÏÎÔÙÛÇ]/g, '');
    if (letters.length < 8) return 0;
    const up = letters.replace(/[^A-ZÀÂÄÉÈÊËÏÎÔÙÛÇ]/g, '').length;
    return up / letters.length;
}

function isDiscordInvite(content) {
    return /discord\.gg\/[\w-]+/i.test(content) || /discord(?:app)?\.com\/invite\//i.test(content);
}

function spamHit(guildId, userId, windowMs, max) {
    const key = `${guildId}:${userId}`;
    const now = Date.now();
    let arr = recentMsgs.get(key) || [];
    arr = arr.filter((t) => now - t <= windowMs);
    arr.push(now);
    recentMsgs.set(key, arr);
    return arr.length >= max;
}

/**
 * @returns {Promise<string | null>} raison courte si action, sinon null
 */
async function runAutoModeration(message) {
    if (!message.guild || message.author.bot) return null;
    if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return null;

    const s = getSettings(message.guild.id);
    if (!s.enabled) return null;

    const content = message.content || '';

    if (s.blockInvites && isDiscordInvite(content)) {
        await message.delete().catch(() => {});
        await message.channel
            .send({
                content: `🚫 ${message.author}, les invitations Discord sont interdites ici.`,
                allowedMentions: { users: [message.author.id] },
            })
            .then((m) => setTimeout(() => m.delete().catch(() => {}), 6000))
            .catch(() => {});
        return 'invite';
    }

    if (s.insults && content.length > 0 && hasInsult(content)) {
        await message.delete().catch(() => {});
        await message.channel
            .send({
                content: `⚠️ ${message.author}, ce langage n’est pas accepté ici.`,
                allowedMentions: { users: [message.author.id] },
            })
            .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000))
            .catch(() => {});
        return 'insulte';
    }

    if (s.caps && content.length >= s.capsMinLen && capsRatio(content) >= s.capsRatio) {
        await message.delete().catch(() => {});
        await message.channel
            .send({
                content: `🔇 ${message.author}, trop de majuscules — reformule calmement.`,
                allowedMentions: { users: [message.author.id] },
            })
            .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000))
            .catch(() => {});
        return 'caps';
    }

    if (s.spam && spamHit(message.guild.id, message.author.id, s.spamWindowMs, s.spamMax)) {
        await message.delete().catch(() => {});
        await message.channel
            .send({
                content: `⏳ ${message.author}, tu envoies trop de messages. Ralentis un peu.`,
                allowedMentions: { users: [message.author.id] },
            })
            .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000))
            .catch(() => {});
        return 'spam';
    }

    return null;
}

module.exports = { runAutoModeration, getSettings };
