const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modLog');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ Non autorisé.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `+unban @user/ID`");

    const targetId = message.mentions.users.first()?.id || args[0];

    const banEntry = await message.guild.bans.fetch(targetId).catch(() => null);
    if (!banEntry) return message.reply("❌ Cet utilisateur n'est pas banni.");

    await message.guild.members.unban(targetId);

    message.react("✅").catch(() => {});

    await sendModLog(client, message.guild, {
        action: 'unban',
        moderator: message.author,
        target: banEntry.user,
    });
};