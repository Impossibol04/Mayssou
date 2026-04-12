const { EmbedBuilder } = require('discord.js');

function randInt(a, b) {
    return a + Math.floor(Math.random() * (b - a + 1));
}

module.exports = async (client, message, args) => {
    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (!sub || sub === 'help') {
        return message.reply(
            `**Mini-jeux**\n` +
                `\`${p}pile\` / \`${p}face\` — pile ou face\n` +
                `\`${p}dés [faces]\` — dé (défaut **6**, max **100**)\n` +
                `\`${p}roulette\` — nombre **0–36** (style roulette européenne)`
        );
    }

    if (sub === 'pile' || sub === 'face' || sub === 'flip' || sub === 'coin') {
        const pile = Math.random() < 0.5;
        const side = pile ? 'Pile' : 'Face';
        const emoji = pile ? '🪙' : '🌕';
        const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle(`${emoji} ${side} !`)
            .setDescription(pile ? '*Tu as tiré **Pile**.*' : '*Tu as tiré **Face**.*')
            .setTimestamp();
        return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'dés' || sub === 'de' || sub === 'dice') {
        let faces = parseInt(args[1], 10);
        if (Number.isNaN(faces)) faces = 6;
        if (faces < 2 || faces > 100) return message.reply('⚠️ Nombre de faces : **2 à 100**.');
        const roll = randInt(1, faces);
        const embed = new EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('🎲 Lancer de dé')
            .setDescription(`D**${faces}** → **${roll}**`)
            .setTimestamp();
        return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'roulette' || sub === 'r') {
        const n = randInt(0, 36);
        const color =
            n === 0 ? 'Vert (0)' : [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n) ? 'Rouge' : 'Noir';
        const embed = new EmbedBuilder()
            .setColor(n === 0 ? 0x2ecc71 : color === 'Rouge' ? 0xe74c3c : 0x2c3e50)
            .setTitle('🎡 Roulette')
            .setDescription(`Numéro **${n}** · ${color}`)
            .setFooter({ text: '0 = vert · 1–36 alternent rouge/noir (approx. européenne)' })
            .setTimestamp();
        return message.channel.send({ embeds: [embed] });
    }

    return message.reply(`⚠️ Sous-commande inconnue. \`${p}minigames help\``);
};

module.exports.aliases = ['jeux', 'game'];
