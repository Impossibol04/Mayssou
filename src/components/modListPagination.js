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

/** Bouton central désactivé (affichage page) — ne reçoit pas de clic. */
const NAV_PAGE_STUB = 'mayssou:nav:page';

const USERS_PER_PAGE = 6;
const WARNS_PER_PAGE = 4;
const BANS_PER_PAGE = 8;

/** @type {Map<string, { list: import('discord.js').GuildBan[], t: number }>} */
const banCache = new Map();
const BAN_CACHE_MS = 45_000;

const COLOR_WARN = 0xf1c40f;
const COLOR_BAN = 0xe74c3c;

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

function navRow(ids, disablePrev, disableNext, pageLabel) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(ids.prev)
            .setLabel('Page préc.')
            .setEmoji('◀')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disablePrev),
        new ButtonBuilder()
            .setCustomId(NAV_PAGE_STUB)
            .setLabel(pageLabel.slice(0, 80))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId(ids.next)
            .setLabel('Page suiv.')
            .setEmoji('▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disableNext)
    );
}

async function buildWarnOverviewEmbed(client, guildId, page) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    const summary = getGuildWarnSummary(guildId);
    if (!summary.length) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(COLOR_WARN)
                    .setTitle('⚠️ Warns — vue globale')
                    .setDescription('*Aucun warn enregistré sur ce serveur.*')
                    .setTimestamp(),
            ],
            components: [],
        };
    }

    const totalPages = Math.max(1, Math.ceil(summary.length / USERS_PER_PAGE));
    const p = Math.min(Math.max(0, page), totalPages - 1);
    const slice = summary.slice(p * USERS_PER_PAGE, (p + 1) * USERS_PER_PAGE);

    const embed = new EmbedBuilder()
        .setColor(COLOR_WARN)
        .setAuthor({
            name: 'Liste des warns',
            iconURL: guild?.iconURL({ size: 64 }) || undefined,
        })
        .setTitle('⚠️ Membres avertis')
        .setDescription(
            `**${summary.length}** membre(s) avec au moins un warn · page **${p + 1}**/**${totalPages}**`
        );
    if (totalPages > 1) embed.setFooter({ text: '◀ ▶ pour naviguer · Données du bot' });
    embed.setTimestamp();

    for (const row of slice) {
        const u = await client.users.fetch(row.userId).catch(() => null);
        const tag = u ? u.tag : 'Utilisateur inconnu';
        embed.addFields({
            name: `${tag}`,
            value: `ID \`${row.userId}\`\n**${row.count}** warn(s)`,
            inline: true,
        });
    }

    const prev = wlId(guildId, 'a', 'x', Math.max(0, p - 1));
    const next = wlId(guildId, 'a', 'x', Math.min(totalPages - 1, p + 1));
    const pageLabel = `📄 ${p + 1} / ${totalPages}`;

    return {
        embeds: [embed],
        components: totalPages > 1 ? [navRow({ prev, next }, p === 0, p >= totalPages - 1, pageLabel)] : [],
    };
}

async function buildWarnUserEmbed(client, guildId, userId, page) {
    const warns = getWarns(guildId, userId);
    const u = await client.users.fetch(userId).catch(() => null);
    const tag = u ? u.tag : userId;
    const guild = await client.guilds.fetch(guildId).catch(() => null);

    if (!warns.length) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(COLOR_WARN)
                    .setTitle(`⚠️ Warns — ${tag}`)
                    .setDescription('*Aucun warn enregistré pour ce membre.*')
                    .setThumbnail(u?.displayAvatarURL({ size: 128 }) || null)
                    .setTimestamp(),
            ],
            components: [],
        };
    }

    const totalPages = Math.max(1, Math.ceil(warns.length / WARNS_PER_PAGE));
    const p = Math.min(Math.max(0, page), totalPages - 1);
    const slice = warns.slice(p * WARNS_PER_PAGE, (p + 1) * WARNS_PER_PAGE);

    const embed = new EmbedBuilder()
        .setColor(COLOR_WARN)
        .setAuthor({
            name: 'Historique des warns',
            iconURL: guild?.iconURL({ size: 64 }) || undefined,
        })
        .setTitle(`⚠️ ${tag}`)
        .setDescription(`**${warns.length}** warn(s) · page **${p + 1}**/**${totalPages}**`)
        .setThumbnail(u?.displayAvatarURL({ size: 256 }) || null);

    const footerUser =
        totalPages > 1 ? `ID ${userId} · ◀ ▶ pour naviguer` : `ID ${userId}`;
    embed.setFooter({ text: footerUser }).setTimestamp();

    slice.forEach((w, idx) => {
        const globalIndex = p * WARNS_PER_PAGE + idx + 1;
        const when = w.at ? `<t:${Math.floor(new Date(w.at).getTime() / 1000)}:f>` : '—';
        embed.addFields({
            name: `#${globalIndex} · ${when}`,
            value: (w.reason || '*Sans raison*').slice(0, 1024),
            inline: false,
        });
    });

    const prev = wlId(guildId, 'u', userId, Math.max(0, p - 1));
    const next = wlId(guildId, 'u', userId, Math.min(totalPages - 1, p + 1));
    const pageLabel = `📄 ${p + 1} / ${totalPages}`;

    return {
        embeds: [embed],
        components: totalPages > 1 ? [navRow({ prev, next }, p === 0, p >= totalPages - 1, pageLabel)] : [],
    };
}

async function buildBanlistEmbed(client, guild, page) {
    const list = await getCachedBanList(guild);
    if (!list.length) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(COLOR_BAN)
                    .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 64 }) || undefined })
                    .setTitle('📋 Bannissements')
                    .setDescription('*Aucun membre banni.*')
                    .setTimestamp(),
            ],
            components: [],
        };
    }

    const totalPages = Math.max(1, Math.ceil(list.length / BANS_PER_PAGE));
    const p = Math.min(Math.max(0, page), totalPages - 1);
    const slice = list.slice(p * BANS_PER_PAGE, (p + 1) * BANS_PER_PAGE);

    const embed = new EmbedBuilder()
        .setColor(COLOR_BAN)
        .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 64 }) || undefined })
        .setTitle('📋 Liste des bannissements')
        .setDescription(
            `**${list.length}** ban(s) au total · page **${p + 1}**/**${totalPages}** · cache ~45s`
        )
        .setThumbnail(guild.iconURL({ size: 256 }) || null);
    if (totalPages > 1) embed.setFooter({ text: 'Utilise ◀ ▶ pour changer de page' });
    embed.setTimestamp();

    slice.forEach((b, idx) => {
        const n = p * BANS_PER_PAGE + idx + 1;
        const user = b.user;
        embed.addFields({
            name: `${n}. ${user.tag}`,
            value: `\`${user.id}\`\n${(b.reason || '*Aucune raison*').slice(0, 900)}`,
            inline: false,
        });
    });

    const gid = guild.id;
    const prev = blId(gid, Math.max(0, p - 1));
    const next = blId(gid, Math.min(totalPages - 1, p + 1));
    const pageLabel = `📄 ${p + 1} / ${totalPages}`;

    return {
        embeds: [embed],
        components: totalPages > 1 ? [navRow({ prev, next }, p === 0, p >= totalPages - 1, pageLabel)] : [],
    };
}

async function handleWarnlistButton(interaction) {
    if (interaction.customId === NAV_PAGE_STUB) return false;
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
    if (interaction.customId === NAV_PAGE_STUB) return false;
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
