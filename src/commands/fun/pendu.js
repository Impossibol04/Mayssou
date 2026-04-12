const { EmbedBuilder } = require('discord.js');
const theme = require('../../utils/embedTheme');

const WORDS = [
    'ordinateur',
    'javascript',
    'discord',
    'musique',
    'serveur',
    'moderateur',
    'chocolat',
    'bibliotheque',
    'aventure',
    'papillon',
    'montagne',
    'printemps',
];

/** @type {Map<string, { word: string, guessed: Set<string>, wrong: number, max: number }>} */
const games = new Map();

function display(word, guessed) {
    return word
        .split('')
        .map((c) => (guessed.has(c) ? c.toUpperCase() : '·'))
        .join(' ');
}

module.exports = async (client, message, args) => {
    const cid = message.channel.id;
    const first = (args[0] || '').toLowerCase();

    if (first === 'new' || first === 'nouveau') {
        games.delete(cid);
    }

    if (!args[0] && games.get(cid)) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.WARN)
                    .setDescription('Une partie est **déjà en cours** — envoie une lettre / un mot, ou `pendu new`.'),
            ],
        });
    }

    if (!args[0] || first === 'new' || first === 'nouveau') {
        const w = WORDS[Math.floor(Math.random() * WORDS.length)]
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        const g = { word: w, guessed: new Set(), wrong: 0, max: 8 };
        games.set(cid, g);
        const mask = display(g.word, new Set());
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.INFO)
                    .setTitle('🪢 Pendu')
                    .setDescription(
                        `Mot de **${g.word.length}** lettres (sans accents).\n\`pendu <lettre>\` ou \`pendu <mot>\` — max **${g.max}** erreurs.\n\n${mask}\n\n\`pendu\` ou \`pendu new\` — nouvelle partie.`
                    ),
            ],
        });
    }

    const g = games.get(cid);
    if (!g) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription('⚠️ Lance une partie avec `pendu` ou `pendu new`.')],
        });
    }

    const input = args[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    if (!input) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription('⚠️ `pendu <lettre>` ou `pendu <mot>`')],
        });
    }

    if (input.length > 1) {
        if (input === g.word) {
            games.delete(cid);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(theme.SUCCESS)
                        .setTitle('🎉 Gagné !')
                        .setDescription(`Le mot était **${g.word}**.`),
                ],
            });
        }
        g.wrong++;
    } else {
        const ch = input[0];
        if (g.word.includes(ch)) g.guessed.add(ch);
        else g.wrong++;
    }

    const mask = display(g.word, g.guessed);
    const won = g.word.split('').every((c) => g.guessed.has(c));

    if (won) {
        games.delete(cid);
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.SUCCESS)
                    .setTitle('🎉 Gagné !')
                    .setDescription(`**${g.word}**\n\n${mask}`),
            ],
        });
    }

    if (g.wrong >= g.max) {
        const w = g.word;
        games.delete(cid);
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.ERROR)
                    .setTitle('💀 Pendu')
                    .setDescription(`Mot : **${w}**\n\n${mask}\n\nErreurs : **${g.wrong}/${g.max}**`),
            ],
        });
    }

    return message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(theme.NEUTRAL)
                .setTitle('Pendu')
                .setDescription(`${mask}\n\nErreurs : **${g.wrong}/${g.max}**`),
        ],
    });
};
