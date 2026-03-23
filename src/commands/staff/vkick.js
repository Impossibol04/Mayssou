const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers))
        return message.reply("❌ Non autorisé.");

    const targetId = message.mentions.users.first()?.id || args[0];
    const member = await message.guild.members.fetch(targetId).catch(() => null);

    if (!member) return message.reply("❌ Membre introuvable.");
    if (!member.voice.channel) return message.reply("❌ Ce membre n'est pas en vocal.");

    await member.voice.disconnect();
    message.reply(`👢 **${member.user.username}** a été expulsé du salon vocal.`);
};