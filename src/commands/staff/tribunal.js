const { PermissionFlagsBits } = require('discord.js');
const { postTribunal } = require('../../components/tribunalInteractive');

module.exports = async (bot, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply('❌ Il faut la permission **Modérer les membres**.');
    }

    let target = message.mentions.members?.first();
    if (!target && args[0] && /^\d{17,20}$/.test(args[0])) {
        target = await message.guild.members.fetch(args[0]).catch(() => null);
    }

    const reason = args.slice(1).join(' ').replace(/<@!?\d+>/g, '').trim();

    if (!target) {
        return message.reply('⚠️ Utilisation : `+tribunal @membre raison du vote`');
    }
    if (!reason) {
        return message.reply('⚠️ Ajoute une **raison** (visible dans le vote).');
    }
    if (target.id === message.author.id) {
        return message.reply('❌ Tu ne peux pas ouvrir un tribunal contre toi-même.');
    }
    if (target.user.bot) {
        return message.reply('❌ Impossible sur un bot.');
    }

    await postTribunal(bot, message.guild, message.channel, {
        target,
        starter: message.member,
        reason,
    });
};
