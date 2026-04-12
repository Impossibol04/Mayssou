const { PermissionFlagsBits } = require('discord.js');
const { buildWarnOverviewEmbed, buildWarnUserEmbed } = require('../../components/modListPagination');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply('❌ Il faut **Modérer les membres**.');

    const target = message.mentions.users.first();
    const idFromArgs = !target && args[0] && /^\d{17,20}$/.test(args[0]) ? args[0] : null;

    if (target || idFromArgs) {
        const uid = target?.id || idFromArgs;
        let page = 0;
        if (args.length >= 2 && /^\d{1,4}$/.test(args[args.length - 1]) && !/^\d{17,20}$/.test(args[args.length - 1]))
            page = Math.max(0, parseInt(args[args.length - 1], 10) - 1);
        const payload = await buildWarnUserEmbed(client, message.guild.id, uid, page);
        return message.channel.send(payload);
    }

    const page = Math.max(0, (parseInt(args[0], 10) || 1) - 1);
    const payload = await buildWarnOverviewEmbed(client, message.guild.id, page);
    return message.channel.send(payload);
};
