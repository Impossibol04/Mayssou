// src/commands/staff/setmodlogs.js
const { PermissionFlagsBits } = require('discord.js');
const { setGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply("❌ Tu n'as pas la permission.");

    const channel = message.mentions.channels.first() || (args[0] ? message.guild.channels.cache.get(args[0]) : message.channel);

    if (!channel?.isTextBased()) return message.reply("❌ Salon texte invalide.");

    setGuildConfig(message.guild.id, 'modLogsChannel', channel.id);
    message.reply(`✅ Salon de **Mod Logs** défini sur ${channel}.`);
};