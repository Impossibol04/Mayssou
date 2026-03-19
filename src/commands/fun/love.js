const { EmbedBuilder } = require('discord.js');

function getLoveScore(id1, id2) {
    const combined = [id1, id2].sort().join('');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        hash += combined.charCodeAt(i);
    }
    return hash % 101;
}

module.exports = async (client, message, args) => {
    const mentions = message.mentions.users;
    let user1, user2;

    if (mentions.size >= 2) { user1 = mentions.at(0); user2 = mentions.at(1); }
    else if (mentions.size === 1) { user1 = message.author; user2 = mentions.first(); }
    else return message.reply("⚠️ Mentionne au moins une personne !");

    const score = getLoveScore(user1.id, user2.id);
    const progress = Math.round(score / 10);
    const bar = "❤️".repeat(progress) + "💔".repeat(10 - progress);

    const embed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('💘 Love Calculator')
        .setDescription(`**${user1.username}** + **${user2.username}**\n\n**${score}%**\n${bar}`)
        .setTimestamp();
    message.channel.send({ embeds: [embed] });
};