const { EmbedBuilder } = require('discord.js');

function hash(a, b) {
    const s = [a, b].sort().join('');
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % 101;
}

module.exports = async (client, message, args) => {
    const mentions = [...message.mentions.users.values()];
    let A;
    let B;

    if (mentions.length >= 2) {
        A = mentions[0];
        B = mentions[1];
    } else if (mentions.length === 1) {
        A = message.author;
        B = mentions[0];
    } else {
        const mems = message.guild.members.cache.filter((m) => !m.user.bot && m.id !== message.author.id);
        const pick = mems.random()?.user;
        if (!pick) return message.reply('❌ Pas assez de membres pour un ship aléatoire.');
        A = message.author;
        B = pick;
    }

    if (B.id === A.id) return message.reply('❌ Choisis une autre personne.');

    const pct = hash(A.id, B.id);
    const embed = new EmbedBuilder()
        .setTitle('💘 Ship')
        .setDescription(`**${A.username}** × **${B.username}**\n\n# **${pct}%**`)
        .setColor(pct > 70 ? 0xff6b9d : pct > 40 ? 0xf1c40f : 0x95a5a6)
        .setFooter({ text: 'Pour le fun — pas de science' })
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};
