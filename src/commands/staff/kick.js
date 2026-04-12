const { PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modlogs');
const { addCase } = require('../../utils/modCasesStore');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
        return message.reply("❌ Non autorisé.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `+kick @user/ID [raison]`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const member = await message.guild.members.fetch(targetId).catch(() => null);

    if (!member) return message.reply("❌ Membre introuvable sur le serveur.");
    if (member.id === message.author.id) return message.reply("❌ Tu ne peux pas te kick toi-même.");
    if (!member.kickable) return message.reply("❌ Je ne peux pas kick ce membre.");

    const reason = args.slice(message.mentions.users.first() ? 1 : 1).join(" ") || "Aucune raison précisée.";

    await member.send(`👢 Tu as été kick du serveur **${message.guild.name}**.\n📋 Raison : ${reason}`).catch(() => {});
    await member.kick(reason);

    const { number } = addCase(message.guild.id, {
        type: 'kick',
        targetUserId: member.id,
        moderatorId: message.author.id,
        reason,
    });

    message.react("✅").catch(() => {});

    await sendModLog(client, message.guild, {
        action: 'kick',
        moderator: message.author,
        target: member.user,
        reason,
        extra: [{ name: '📎 Cas', value: `\`#${number}\``, inline: true }],
    });
};