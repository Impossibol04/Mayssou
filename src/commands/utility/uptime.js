const { EmbedBuilder } = require('discord.js');

module.exports = async (bot, message, args) => {
    const totalSeconds = bot.uptime / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = Math.floor(totalSeconds % 60);

    const uptimeString = `\`${days}j ${hours}h ${minutes}m ${seconds}s\``;

    const embed = new EmbedBuilder()
        .setAuthor({ name: 'Mayssou', iconURL: bot.user.displayAvatarURL({ size: 64 }) })
        .setTitle('⏱️ Disponibilité')
        .setColor(0x57f287)
        .addFields(
            { name: 'En ligne depuis', value: uptimeString, inline: true },
            { name: 'Version', value: '`Mayssou v1.0`', inline: true }
        )
        .setFooter({ text: message.author.tag })
        .setTimestamp();

    await message.reply({ embeds: [embed] });
};
