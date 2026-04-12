const { PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return message.reply('❌ Il faut **Gérer les salons**.');

    const sec = parseInt(args[0], 10);
    if (isNaN(sec) || sec < 0 || sec > 21_600)
        return message.reply('⚠️ Utilisation : `slowmode <0-21600>` (secondes, 0 = désactivé).');

    const ch = message.channel;
    if (!ch.isTextBased() || ch.type === ChannelType.DM) return message.reply('❌ Salon incompatible.');

    try {
        await ch.setRateLimitPerUser(sec, `Par ${message.author.tag}`);
        message.reply(sec === 0 ? '✅ Slowmode **désactivé**.' : `✅ Slowmode : **${sec}s** entre deux messages.`);
    } catch (e) {
        message.reply('❌ Impossible de modifier ce salon.');
    }
};
