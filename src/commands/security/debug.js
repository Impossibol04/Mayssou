const { EmbedBuilder } = require('discord.js');
const { isBotOwner } = require('../../utils/commandGuards');
const { ownerCommandDeniedLines } = require('../../utils/ownerMessages');

module.exports = async (client, message, args) => {
    if (!isBotOwner(message.author.id)) return message.reply(ownerCommandDeniedLines());

    const mem = process.memoryUsage();
    const embed = new EmbedBuilder()
        .setTitle('🛠️ Debug bot')
        .setColor(0x2ecc71)
        .addFields(
            { name: 'Serveurs', value: `${client.guilds.cache.size}`, inline: true },
            { name: 'Utilisateurs (cache)', value: `${client.users.cache.size}`, inline: true },
            { name: 'Ping WS', value: `${client.ws.ping} ms`, inline: true },
            {
                name: 'Mémoire RSS',
                value: `${(mem.rss / 1024 / 1024).toFixed(1)} Mo`,
                inline: true,
            },
            { name: 'Node', value: process.version, inline: true },
            { name: 'Uptime', value: `${(process.uptime() / 3600).toFixed(2)} h`, inline: true }
        )
        .setTimestamp();

    message.reply({ embeds: [embed] });
};
