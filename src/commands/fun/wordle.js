const { EmbedBuilder } = require('discord.js');
const theme = require('../../utils/embedTheme');

const WORDS = [
    'PATTE',
    'TABLE',
    'MERLE',
    'FORGE',
    'BRUME',
    'PLAGE',
    'TIGRE',
    'RUBAN',
    'CHOUX',
    'BLANC',
    'NOIRE',
    'SONGE',
    'FIBRE',
    'PERLE',
    'GIVRE',
    'MARGE',
    'VAGUE',
    'LINGE',
    'POIRE',
    'TARIF',
];

/** @type {Map<string, { word: string, guesses: string[] }>} */
const games = new Map();

function pickWord() {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function score(secret, guess) {
    const s = secret.split('');
    const g = guess.split('');
    const out = ['⬛', '⬛', '⬛', '⬛', '⬛'];
    const usedS = new Array(5).fill(false);
    const usedG = new Array(5).fill(false);
    for (let i = 0; i < 5; i++) {
        if (g[i] === s[i]) {
            out[i] = '🟩';
            usedS[i] = true;
            usedG[i] = true;
        }
    }
    for (let i = 0; i < 5; i++) {
        if (usedG[i]) continue;
        for (let j = 0; j < 5; j++) {
            if (usedS[j] || s[j] !== g[i]) continue;
            out[i] = '🟨';
            usedS[j] = true;
            usedG[i] = true;
            break;
        }
    }
    return out.join('');
}

module.exports = async (client, message, args) => {
    const cid = message.channel.id;
    const first = (args[0] || '').toLowerCase();

    if (!args[0] || first === 'new' || first === 'nouveau') {
        if (first === 'new' || first === 'nouveau') games.delete(cid);
        const g = { word: pickWord(), guesses: [] };
        games.set(cid, g);
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.INFO)
                    .setTitle('🟩 Wordle (5 lettres)')
                    .setDescription(
                        `Nouvelle grille — **6** essais max.\nEnvoie \`wordle <MOT>\` (5 lettres A-Z).\n\`wordle new\` pour recommencer.`
                    ),
            ],
        });
    }

    const g = games.get(cid);
    if (!g) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription('⚠️ Lance une partie avec `wordle` ou `wordle new`.')],
        });
    }

    const raw = args[0].toUpperCase().replace(/[^A-Z]/g, '');
    if (raw.length !== 5) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription('⚠️ Exactement **5** lettres : `wordle TABLE`')],
        });
    }

    if (g.guesses.length >= 6) {
        const w = g.word;
        games.delete(cid);
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.ERROR)
                    .setDescription(`💀 Déjà terminé — le mot était **${w}**. \`wordle\` pour rejouer.`),
            ],
        });
    }

    g.guesses.push(raw);
    const hist = g.guesses.map((w) => `${w} → ${score(g.word, w)}`).join('\n');

    if (raw === g.word) {
        games.delete(cid);
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.SUCCESS)
                    .setTitle('🎉 Trouvé !')
                    .setDescription(`**${g.word}** en **${g.guesses.length}** coup(s) !\n\n${hist}`),
            ],
        });
    }

    if (g.guesses.length >= 6) {
        const w = g.word;
        games.delete(cid);
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.ERROR)
                    .setTitle('💀 Perdu')
                    .setDescription(`Mot : **${w}**\n\n${hist}`),
            ],
        });
    }

    return message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(theme.NEUTRAL)
                .setTitle('Wordle')
                .setDescription(`${hist}\n\nEssais : **${g.guesses.length}/6**`),
        ],
    });
};
