const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const path = require('path');
const { addScore } = require('../utils/quizStore');

const PREFIX = 'mayssou:qz:';

const bank = require(path.join(__dirname, '../data/quizQuestions.json'));

/** @type {Map<string, { answer: number, authorId: string, guildId: string, category: string }>} */
const sessions = new Map();

function pickQuestion(cat) {
    if (cat === 'mix') {
        const keys = ['culture', 'anime', 'gaming'].filter((k) => bank[k]?.length);
        if (!keys.length) return null;
        const k = keys[Math.floor(Math.random() * keys.length)];
        const arr = bank[k];
        const item = arr[Math.floor(Math.random() * arr.length)];
        return { ...item, _cat: k };
    }
    const arr = bank[cat];
    if (!arr?.length) return null;
    const item = arr[Math.floor(Math.random() * arr.length)];
    return { ...item, _cat: cat };
}

function makeId() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function buildQuizPayload({ authorId, authorTag, guildId, category }) {
    const cat = ['culture', 'anime', 'gaming', 'mix'].includes(category) ? category : 'mix';
    const q = pickQuestion(cat);
    if (!q) return null;

    const sessionId = makeId();
    const realCat = q._cat || cat;
    sessions.set(sessionId, { answer: q.a, authorId, guildId, category: realCat });

    const row = new ActionRowBuilder();
    q.choices.forEach((label, i) => {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`${PREFIX}${sessionId}:${i}`)
                .setLabel(String(label).slice(0, 80))
                .setStyle(ButtonStyle.Secondary)
        );
    });

    const catLabel =
        cat === 'mix'
            ? 'Mélange'
            : cat === 'culture'
              ? 'Culture G.'
              : cat === 'anime'
                ? 'Anime'
                : cat === 'gaming'
                  ? 'Gaming'
                  : cat;
    const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle(`❓ Quiz — ${catLabel}`)
        .setDescription(`**${q.q}**\n\n_Choix par **${authorTag}** uniquement._`)
        .setFooter({ text: 'Bonne réponse = +1 point sur ce serveur' })
        .setTimestamp();

    return { embeds: [embed], components: [row], sessionId };
}

async function handleQuizButton(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith(PREFIX)) return false;

    const rest = interaction.customId.slice(PREFIX.length);
    const last = rest.lastIndexOf(':');
    const sessionId = rest.slice(0, last);
    const idx = parseInt(rest.slice(last + 1), 10);
    const st = sessions.get(sessionId);

    if (!st || st.guildId !== interaction.guildId) {
        await interaction.reply({ ephemeral: true, content: '❌ Question expirée.' });
        return true;
    }

    if (interaction.user.id !== st.authorId) {
        await interaction.reply({ ephemeral: true, content: '❌ Ce quiz a été lancé par quelqu’un d’autre.' });
        return true;
    }

    sessions.delete(sessionId);
    const ok = idx === st.answer;
    const stats = addScore(interaction.guild.id, interaction.user.id, st.category, ok);

    const embed = new EmbedBuilder()
        .setColor(ok ? 0x2ecc71 : 0xe74c3c)
        .setTitle(ok ? '✅ Bonne réponse !' : '❌ Mauvaise réponse')
        .setDescription(ok ? `+1 point · Total serveur : **${stats.total}**` : `La bonne réponse était l’option **${st.answer + 1}**.`)
        .setTimestamp();

    await interaction.update({ embeds: [embed], components: [] });
    return true;
}

setInterval(() => {
    if (sessions.size > 300) sessions.clear();
}, 900_000);

module.exports = { buildQuizPayload, handleQuizButton, PREFIX };
