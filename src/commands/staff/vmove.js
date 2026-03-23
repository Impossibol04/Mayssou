const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers))
        return message.reply("❌ Non autorisé.");

    if (!args[0] || !args[1])
        return message.reply("⚠️ Utilisation : `+vmove @user/ID #salon/ID`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const member = await message.guild.members.fetch(targetId).catch(() => null);

    if (!member) return message.reply("❌ Membre introuvable.");
    if (!member.voice.channel) return message.reply("❌ Ce membre n'est pas en vocal.");

    // Récupère le salon vocal via mention ou ID
    const channelId = message.mentions.channels.first()?.id || args[1];
    const channel = message.guild.channels.cache.get(channelId);

    if (!channel) return message.reply("❌ Salon introuvable.");
    if (!channel.isVoiceBased()) return message.reply("❌ Ce salon n'est pas un salon vocal.");

    await member.voice.setChannel(channel);
    message.reply(`🚀 **${member.user.username}** a été déplacé dans ${channel}.`);
};