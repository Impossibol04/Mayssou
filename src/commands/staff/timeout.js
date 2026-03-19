const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply("❌ Non autorisé.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `+timeout @user/ID [minutes]`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const duration = parseInt(message.mentions.users.first() ? args[1] : args[1]);

    if (isNaN(duration) || duration < 1)
        return message.reply("⚠️ Précise une durée en minutes. Ex: `+timeout @user 10`");

    const member = await message.guild.members.fetch(targetId).catch(() => null);
    if (!member) return message.reply("❌ Membre introuvable sur le serveur.");
    if (member.id === message.author.id) return message.reply("❌ Tu ne peux pas te timeout toi-même.");

    await member.timeout(duration * 60 * 1000);
    message.channel.send(`🤐 **${member.user.username}** est en mode lecture seule pour **${duration} min**.`);
};