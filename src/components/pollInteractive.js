const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const PREFIX = 'mayssou:pl:';

/** @type {Map<string, { question: string, authorId: string, authorTag: string, optionLabels: string[], voters: Map<string, number>, guildId: string }>} */
const polls = new Map();

function makePollId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function tally(voters, len) {
    const c = new Array(len).fill(0);
    for (const idx of voters.values()) {
        if (idx >= 0 && idx < len) c[idx]++;
    }
    return c;
}

function buildPollEmbed(question, optionLabels, counts, authorTag) {
    const total = counts.reduce((a, b) => a + b, 0);
    const lines = optionLabels.map((opt, i) => {
        const n = counts[i];
        const pct = total ? Math.round((n / total) * 100) : 0;
        const bar = '█'.repeat(Math.min(12, Math.round((pct / 100) * 12))) + '░'.repeat(Math.max(0, 12 - Math.round((pct / 100) * 12)));
        return `**${i + 1}.** ${opt}\n\`${bar}\` **${n}** vote(s) · ${pct}%`;
    });

    return new EmbedBuilder()
        .setTitle('📊 Sondage')
        .setColor(0x5865f2)
        .setDescription(`**${question}**\n\n${lines.join('\n\n')}`)
        .setFooter({ text: `Par ${authorTag} · ${total} vote(s) au total` })
        .setTimestamp();
}

function buildPollRows(pollId, optionLabels) {
    const row = new ActionRowBuilder();
    const styles = [
        ButtonStyle.Primary,
        ButtonStyle.Success,
        ButtonStyle.Secondary,
        ButtonStyle.Danger,
        ButtonStyle.Primary,
    ];
    optionLabels.forEach((label, i) => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`${PREFIX}${pollId}:${i}`)
                .setLabel(label.slice(0, 80))
                .setStyle(styles[i % styles.length])
        );
    });
    return [row];
}

/**
 * @returns {{ embeds: any[], components: any[], pollId: string }}
 */
function createInteractivePoll({ question, optionLabels, authorId, authorTag, guildId }) {
    const pollId = makePollId();
    polls.set(pollId, {
        question,
        authorId,
        authorTag,
        optionLabels,
        voters: new Map(),
        guildId,
    });

    const counts = tally(polls.get(pollId).voters, optionLabels.length);
    const embed = buildPollEmbed(question, optionLabels, counts, authorTag);

    return {
        embeds: [embed],
        components: buildPollRows(pollId, optionLabels),
        pollId,
    };
}

function buildUpdatedPayload(pollId) {
    const st = polls.get(pollId);
    if (!st) return null;
    const counts = tally(st.voters, st.optionLabels.length);
    return {
        embeds: [buildPollEmbed(st.question, st.optionLabels, counts, st.authorTag)],
        components: buildPollRows(pollId, st.optionLabels),
    };
}

async function handlePollButton(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith(PREFIX)) return false;

    const rest = interaction.customId.slice(PREFIX.length);
    const lastColon = rest.lastIndexOf(':');
    if (lastColon === -1) return false;
    const pollId = rest.slice(0, lastColon);
    const idx = parseInt(rest.slice(lastColon + 1), 10);
    const st = polls.get(pollId);
    if (!st || interaction.guildId !== st.guildId) {
        await interaction.reply({ ephemeral: true, content: '❌ Sondage invalide ou expiré.' });
        return true;
    }
    if (Number.isNaN(idx) || idx < 0 || idx >= st.optionLabels.length) {
        await interaction.reply({ ephemeral: true, content: '❌ Choix invalide.' });
        return true;
    }

    st.voters.set(interaction.user.id, idx);
    const counts = tally(st.voters, st.optionLabels.length);
    const newEmbed = buildPollEmbed(st.question, st.optionLabels, counts, st.authorTag);

    await interaction.update({
        embeds: [newEmbed],
        components: buildPollRows(pollId, st.optionLabels),
    });
    return true;
}

/** Nettoie les sondages très vieux (évite fuite mémoire). */
setInterval(() => {
    if (polls.size > 500) {
        const keys = [...polls.keys()].slice(0, polls.size - 400);
        keys.forEach((k) => polls.delete(k));
    }
}, 600_000);

module.exports = {
    createInteractivePoll,
    handlePollButton,
    PREFIX,
    polls,
};
