const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const target = message.mentions.users.first() || message.author;
    const score = Math.floor(Math.random() * 101);
    const commentaire = score > 80 ? "🏳️‍🌈 Le radar explose ! Expert confirmé."
        : score > 50 ? "Il y a un petit quelque chose là... 👀"
        : score > 20 ? "Rien de bien flagrant. 👍"
        : "0% détecté. Un vrai glaçon. 🧊";
    const embed = new EmbedBuilder()
        .setColor('#ff00ff')
        .setTitle('🏳️‍🌈 Gayrate Machine')
        .setDescription(`**${target.username}** est gay de : **${score}%**\n\n*${commentaire}*`)
        .setTimestamp();
    message.channel.send({ embeds: [embed] });
};