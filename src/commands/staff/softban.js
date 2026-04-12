const { PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modlogs');

const DELETE_SEC = 604_800;

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply('❌ Il faut **Bannir des membres**.');

    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply('❌ Le bot ne peut pas bannir.');

    const targetId = message.mentions.users.first()?.id || args[0];
    if (!targetId) return message.reply('⚠️ Utilisation : `softban @membre [raison]`');

    const member = await message.guild.members.fetch(targetId).catch(() => null);
    if (!member) return message.reply('❌ Membre introuvable.');
    if (member.id === message.author.id) return message.reply('❌ Non.');
    if (!member.bannable) return message.reply('❌ Je ne peux pas bannir ce membre.');

    const reason =
        args.slice(message.mentions.users.first() ? 1 : 1).join(' ').trim() || 'Softban (kick + purge messages)';

    try {
        await member.ban({ deleteMessageSeconds: DELETE_SEC, reason: `${reason} | softban ${message.author.tag}` });
        await message.guild.members.unban(targetId, 'Softban : purge puis déban').catch(() => {});
        await sendModLog(client, message.guild, {
            action: 'softban',
            moderator: message.author,
            target: member.user,
            reason,
        });
        message.reply(`✅ **${member.user.tag}** softban (messages récents supprimés, membre débanni).`);
    } catch (e) {
        console.error(e);
        message.reply('❌ Échec du softban.');
    }
};
