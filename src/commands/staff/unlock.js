const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return message.reply("❌ Non autorisé.");

    // Accepte : mention, ID, ou salon actuel
    const channel = message.mentions.channels.first()
        || (args[0] ? message.guild.channels.cache.get(args[0]) : null)
        || message.channel;

    if (!channel) return message.reply("❌ Salon introuvable.");

    await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: true
    });

    message.channel.send(`🔓 ${channel} déverrouillé.`);
};