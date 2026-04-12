const { PermissionFlagsBits } = require('discord.js');
const { buildBanlistEmbed } = require('../../components/modListPagination');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply('❌ Tu as besoin de **Bannir des membres**.');

    const page = Math.max(0, (parseInt(args[0], 10) || 1) - 1); // 1-based → 0-based
    const payload = await buildBanlistEmbed(client, message.guild, page);
    return message.channel.send(payload);
};
