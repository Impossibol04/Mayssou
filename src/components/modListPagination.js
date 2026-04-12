const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} = require('discord.js');
const { getGuildWarnSummary, getWarns } = require('../utils/warnStore');

const PREFIX_WL = 'mayssou:wl:';
const PREFIX_BL = 'mayssou:bl:';

const USERS_PER_PAGE = 6;
const WARNS_PER_PAGE = 4;
const BANS_PER_PAGE = 8;

/** @type {Map<string, { list: import('discord.js').GuildBan[], t: number }>} */
const banCache = new Map();
const BAN_CACHE_MS = 45_000;

function wlId(guildId, mode, userIdOrX, page) {
    return `${PREFIX_WL}${guildId}:${mode}:${userIdOrX}:${page}`;
}

function parseWl(customId) {
    const raw = customId.slice(PREFIX_WL.length);
    const parts = raw.split(':');
    if (parts.length < 4) return null;
    const [guildId, mode, userIdOrX, pageStr] = parts;
    const page = parseInt(pageStr, 10);
    if (!guildId || (mode !== 'a' && mode !== 'u') || isNaN(page)) return null;
    return { guildId, mode, userIdOrX, page };
}

function blId(guildId, page) {
    return `${PREFIX_BL}${guildId}:${page}`;
}

function parseBl(customId) {
    const raw = customId.slice(PREFIX_BL.length);
    const i = raw.lastIndexOf(':');
    if (i === -1) return null;
    const guildId = raw.slice(0, i);
    const page = parseInt(raw.slice(i + 1), 10);
    if (!guildId || isNaN(page)) return null;
    return { guildId, page };
}

async function getCachedBanList(guild) {
    const key = guild.id;
    const hit = banCache.get(key);
    if (hit && Date.now() - hit.t < BAN_CACHE_MS) return hit.list;

    const list = [];
    let before;
    for (let round = 0; round < 50; round++) {
        const batch = await guild.bans.fetch({ limit: 1000, before }).catch(() => null);
        if (!batch || batch.size === 0) break;
        list.push(...batch.values());
        const last = batch.last();
        before = last?.user?.id;
        if (batch.size < 1000) break;
    }
    banCache.set(key, { list, t: Date.now() });
    return list;
}

function navRow(ids, disablePrev, disableNext) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(ids.prev).setLabel('◀ Précédent').setStyle(ButtonStyle.Secondary).setDisabled(disablePrev),
        new ButtonBuilder().setCustomId(ids.next).setLabel('Suivant ▶').setStyle(ButtonStyle.Secondary).setDisabled(disableNext)
    );
}

async function buildWarnOverviewEmbed(client, guildId, page) {
    const summary = getGuildWarnSummary(guildId);
    if (!summary.length) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle('⚠️ Warns — vue globale')
                    .setDescription('Aucun warn enregistré sur ce serveur.')
                    .setColor(0xf1c40f),
            ],
            components: [],
        };
    }

    const totalPages = Math.max(1, Math.ceil(summary.length / USERS_PER_PAGE));
    const p = Math.min(Math.max(0, page), totalPages - 1);
    const slice = summary.slice(p * USERS_PER_PAGE, (p + 1) * USERS_PER_PAGE);

    const lines = await Promise.all(
        slice.map(async (row) => {
            const u = await client.users.fetch(row.userId).catch(() => null);
            const tag = u ? u.tag : row.userId;
            return `**${tag}** — \`${row.userId}\` — **${row.count}** warn(s)`;
        })
    );

    const embed = new EmbedBuilder()
        .setTitle('⚠️ Warns — tous les membres')
        .setDescription(lines.join('\n').slice(0, 4000))
        .setColor(0xf1c40f)
        .setFooter({ text: `Page ${p + 1}/${totalPages} • ${summary.length} membre(s) • Boutons : navigation` })
        .setTimestamp();

    const prev = wlId(guildId, 'a', 'x', Math.max(0, p - 1));
    const next = wlId(guildId, 'a', 'x', Math.min(totalPages - 1, p + 1));

    return {
        embeds: [embed],
        components: totalPages > 1 ? [navRow({ prev, next }, p === 0, p >= totalPages - 1)] : [],
    };
}

async function buildWarnUserEmbed(client, guildId, userId, page) {
    const warns = getWarns(guildId, userId);
    const u = await client.users.fetch(userId).catch(() => null);
    const tag = u ? u.tag : userId;

    if (!warns.length) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle(`⚠️ Warns — ${tag}`)
                    .setDescription('Aucun warn enregistré.')
                    .setColor(0xf1c40f),
            ],
            components: [],
        };
    }

    const totalPages = Math.max(1, Math.ceil(warns.length / WARNS_PER_PAGE));
    const p = Math.min(Math.max(0, page), totalPages - 1);
    const slice = warns.slice(p * WARNS_PER_PAGE, (p + 1) * WARNS_PER_PAGE);

    const lines = slice.map((w, idx) => {
        const globalIndex = p * WARNS_PER_PAGE + idx + 1;
        const when = w.at ? `<t:${Math.floor(new Date(w.at).getTime() / 1000)}:f>` : '—';
        return `**${globalIndex}.** ${when}\n${(w.reason || '—').slice(0, 350)}`;
    });

    const embed = new EmbedBuilder()
        .setTitle(`⚠️ Warns — ${tag}`)
        .setDescription(lines.join('\n\n').slice(0, 4000))
        .setColor(0xf1c40f)
        .setFooter({ text: `Page ${p + 1}/${totalPages} • ${warns.length} warn(s)` })
        .setTimestamp();

    const prev = wlId(guildId, 'u', userId, Math.max(0, p - 1));
    const next = wlId(guildId, 'u', userId, Math.min(totalPages - 1, p + 1));

    return {
        embeds: [embed],
        components: totalPages > 1 ? [navRow({ prev, next }, p === 0, p >= totalPages - 1)] : [],
    };
}

async function buildBanlistEmbed(client, guild, page) {
    const list = await getCachedBanList(guild);
    if (!list.length) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle(`📋 Bannissements — ${guild.name}`)
                    .setDescription('Aucun ban.')
                    .setColor(0xe74c3c),
            ],
            components: [],
        };
    }

    const totalPages = Math.max(1, Math.ceil(list.length / BANS_PER_PAGE));
    const p = Math.min(Math.max(0, page), totalPages - 1);
    const slice = list.slice(p * BANS_PER_PAGE, (p + 1) * BANS_PER_PAGE);

    const lines = slice.map((b, idx) => {
        const n = p * BANS_PER_PAGE + idx + 1;
        const u = b.user;
        return `**${n}.** ${u.tag} (\`${u.id}\`)\n└ ${(b.reason || '—').slice(0, 120)}`;
    });

    const embed = new EmbedBuilder()
        .setTitle(`📋 Bannissements — ${guild.name}`)
        .setDescription(lines.join('\n\n').slice(0, 4000))
        .setColor(0xe74c3c)
        .setFooter({ text: `Page ${p + 1}/${totalPages} • ${list.length} ban(s) • Cache ~45s` })
        .setTimestamp();

    const gid = guild.id;
    const prev = blId(gid, Math.max(0, p - 1));
    const next = blId(gid, Math.min(totalPages - 1, p + 1));

    return {
        embeds: [embed],
        components: totalPages > 1 ? [navRow({ prev, next }, p === 0, p >= totalPages - 1)] : [],
    };
}

async function handleWarnlistButton(interaction) {
    const parsed = parseWl(interaction.customId);
    if (!parsed || interaction.guild.id !== parsed.guildId) return false;
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ ephemeral: true, content: '❌ Permission **Modérer les membres** requise.' });
        return true;
    }

    const payload =
        parsed.mode === 'a'
            ? await buildWarnOverviewEmbed(interaction.client, parsed.guildId, parsed.page)
            : await buildWarnUserEmbed(interaction.client, parsed.guildId, parsed.userIdOrX, parsed.page);

    await interaction.deferUpdate();
    await interaction.message.edit(payload);
    return true;
}

async function handleBanlistButton(interaction) {
    const parsed = parseBl(interaction.customId);
    if (!parsed || interaction.guild.id !== parsed.guildId) return false;
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ ephemeral: true, content: '❌ Permission **Bannir des membres** requise.' });
        return true;
    }

    const payload = await buildBanlistEmbed(interaction.client, interaction.guild, parsed.page);
    await interaction.deferUpdate();
    await interaction.message.edit(payload);
    return true;
}

module.exports = {
    buildWarnOverviewEmbed,
    buildWarnUserEmbed,
    buildBanlistEmbed,
    getCachedBanList,
    handleWarnlistButton,
    handleBanlistButton,
    PREFIX_WL,
    PREFIX_BL,
};
