const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const choseANoter = args.join(" ");
    const score = Math.floor(Math.random() * 101);
    const commentaire = score > 80 ? "Wow ! Impressionnant. ✨"
        : score > 50 ? "Pas mal du tout ! 👍"
        : score > 20 ? "C'est moyen... 😕"
        : score > 1 ? "Aïe, c'est un peu la cata. 💀"
        : "force à toi frérot. 💔";

    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📊 Machine à noter')
        .setDescription(choseANoter
            ? `Je donne une note de **${score}/100** à **${choseANoter}** !\n\n*${commentaire}*`
            : `Je te donne une note de **${score}/100**, ${message.author.username} !\n\n*${commentaire}*`)
        .setTimestamp();
    message.channel.send({ embeds: [embed] });
};