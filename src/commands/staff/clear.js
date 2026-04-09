const { PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modLog');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
        return message.reply("❌ Non autorisé.");

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100)
        return message.reply("⚠️ Précise un nombre entre 1 et 100.");

    const deleted = await message.channel.bulkDelete(amount, true);

    message.channel.send(`🧹 **${deleted.size}** messages atomisés.`)
        .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));

    await sendModLog(client, message.guild, {
        action: 'clear',
        moderator: message.author,
        extra: [
            { name: '📋 Salon', value: `${message.channel}`, inline: true },
            { name: '🗑️ Messages supprimés', value: `${deleted.size}`, inline: true },
        ],
    });
};