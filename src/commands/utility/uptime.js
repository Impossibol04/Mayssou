const { EmbedBuilder } = require('discord.js');

module.exports = async (bot, message, args) => {
    // On calcule le temps écoulé depuis le démarrage du bot
    // bot.uptime donne le temps en millisecondes
    const totalSeconds = (bot.uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = Math.floor(totalSeconds % 60);

    // On prépare un affichage propre
    const uptimeString = `\`${days}j ${hours}h ${minutes}m ${seconds}s\``;

    const embed = new EmbedBuilder()
        .setTitle("⏱️ État du Système")
        .setColor("#00ff99") // Une petite couleur verte pour dire que tout va bien
        .addFields(
            { name: "En ligne depuis", value: uptimeString, inline: true },
            { name: "Bot version", value: `\`Mayssou v1.0\``, inline: true }
        )
        .setFooter({ text: `Demandé par ${message.author.tag}` })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
};