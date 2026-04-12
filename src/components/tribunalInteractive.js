const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} = require('discord.js');
const { sendModLog } = require('../utils/modlogs');

const PREFIX = 'mayssou:tr:';
const DURATION_MS = 120_000;
const TIMEOUT_IF_PUNISH_MS = 10 * 60 * 1000;

/** @type {Map<string, { guildId: string, channelId: string, messageId: string | null, targetId: string, starterId: string, reason: string, yes: Set<string>, no: Set<string>, endsAt: number, finalized: boolean }>} */
const tribunalCases = new Map();

function makeCaseId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function buildEmbed(st, guild) {
    const left = Math.max(0, Math.ceil((st.endsAt - Date.now()) / 1000));
    const y = st.yes.size;
    const n = st.no.size;
    const status = st.finalized
        ? '**Vote terminé.**'
        : `Vote ouvert encore **${left}s** · Punir **${y}** · Absoudre **${n}**`;
    return new EmbedBuilder()
        .setColor(st.finalized ? 0x95a5a6 : 0xe67e22)
        .setTitle('⚖️ Tribunal communautaire')
        .setDescription(
            [
                `**Accusé :** <@${st.targetId}>`,
                `**Motif :** ${st.reason.slice(0, 900)}`,
                '',
                status,
            ].join('\n')
        )
        .setFooter({ text: `Ouvert par un modérateur · ID dossier ${st.guildId.slice(-6)}` })
        .setTimestamp();
}

function buildRow(caseId, st, disabled) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`${PREFIX}${caseId}:yes`)
            .setLabel(`Punir (${st.yes.size})`)
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`${PREFIX}${caseId}:no`)
            .setLabel(`Absoudre (${st.no.size})`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled)
    );
}

async function finalizeCase(bot, caseId) {
    const st = tribunalCases.get(caseId);
    if (!st || st.finalized) return;
    st.finalized = true;

    const guild = bot.guilds.cache.get(st.guildId);
    const channel = guild?.channels.cache.get(st.channelId);
    let msg = null;
    if (channel?.isTextBased() && st.messageId) {
        try {
            msg = await channel.messages.fetch(st.messageId);
        } catch (_) {}
    }

    const y = st.yes.size;
    const n = st.no.size;
    let outcome = 'Égalité ou majorité pour l’absolution — **aucune sanction.**';

    if (guild && y > n) {
        const me = guild.members.me;
        const target = await guild.members.fetch(st.targetId).catch(() => null);
        if (target && me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            try {
                await target.timeout(TIMEOUT_IF_PUNISH_MS, 'Tribunal communautaire (votes)');
                outcome = `**Sanction appliquée :** timeout 10 min (${y} punir / ${n} absoudre).`;
                await sendModLog(bot, guild, {
                    action: 'timeout',
                    moderator: bot.user,
                    target: target.user,
                    reason: `Tribunal · ${st.reason.slice(0, 200)}`,
                }).catch(() => {});
            } catch (e) {
                outcome = `**Majorité « punir »** mais impossible d’appliquer le timeout : ${e.message}`;
            }
        } else {
            outcome = '**Majorité « punir »** mais permissions ou membre introuvable.';
        }
    } else if (y <= n) {
        outcome = `**Pas de sanction** (${y} punir / ${n} absoudre).`;
    }

    const baseDesc = [
        `**Accusé :** <@${st.targetId}>`,
        `**Motif :** ${st.reason.slice(0, 900)}`,
        '',
        `**Vote terminé.** Punir **${y}** · Absoudre **${n}**`,
        '',
        outcome,
    ].join('\n');

    const embed = new EmbedBuilder()
        .setColor(0x95a5a6)
        .setTitle('⚖️ Tribunal communautaire')
        .setDescription(baseDesc)
        .setTimestamp();

    if (msg) {
        await msg.edit({ embeds: [embed], components: [buildRow(caseId, st, true)] }).catch(() => {});
    } else if (channel?.isTextBased()) {
        await channel.send({ embeds: [embed] }).catch(() => {});
    }

    tribunalCases.delete(caseId);
}

function scheduleFinalize(bot, caseId) {
    setTimeout(() => finalizeCase(bot, caseId).catch((e) => console.error('[tribunal]', e)), DURATION_MS);
}

/**
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').TextChannel} channel
 */
async function postTribunal(bot, guild, channel, { target, starter, reason }) {
    const caseId = makeCaseId();
    const st = {
        guildId: guild.id,
        channelId: channel.id,
        messageId: null,
        targetId: target.id,
        starterId: starter.id,
        reason: reason || '(aucune)',
        yes: new Set(),
        no: new Set(),
        endsAt: Date.now() + DURATION_MS,
        finalized: false,
    };
    tribunalCases.set(caseId, st);

    const embed = buildEmbed(st, guild);
    const row = buildRow(caseId, st, false);
    const msg = await channel.send({ embeds: [embed], components: [row] });
    st.messageId = msg.id;
    scheduleFinalize(bot, caseId);
    return caseId;
}

async function handleTribunalButton(bot, interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith(PREFIX)) return false;

    const rest = interaction.customId.slice(PREFIX.length);
    const last = rest.lastIndexOf(':');
    const caseId = rest.slice(0, last);
    const vote = rest.slice(last + 1);
    const st = tribunalCases.get(caseId);

    if (!st || st.guildId !== interaction.guildId) {
        await interaction.reply({ ephemeral: true, content: '❌ Ce tribunal est terminé ou invalide.' });
        return true;
    }

    if (st.finalized || Date.now() >= st.endsAt) {
        await interaction.reply({ ephemeral: true, content: '❌ Les votes sont clos.' });
        return true;
    }

    if (interaction.user.id === st.targetId) {
        await interaction.reply({ ephemeral: true, content: '❌ Tu ne peux pas voter sur ton propre dossier.' });
        return true;
    }

    if (vote === 'yes') {
        st.no.delete(interaction.user.id);
        st.yes.add(interaction.user.id);
    } else if (vote === 'no') {
        st.yes.delete(interaction.user.id);
        st.no.add(interaction.user.id);
    } else {
        return false;
    }

    const embed = buildEmbed(st, interaction.guild);
    await interaction.update({ embeds: [embed], components: [buildRow(caseId, st, false)] });
    return true;
}

setInterval(() => {
    if (tribunalCases.size > 200) {
        const now = Date.now();
        for (const [id, st] of tribunalCases) {
            if (st.finalized || now > st.endsAt + 300_000) tribunalCases.delete(id);
        }
    }
}, 300_000);

module.exports = {
    postTribunal,
    handleTribunalButton,
    PREFIX,
};
