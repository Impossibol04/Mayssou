const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
        return message.reply("❌ Non autorisé.");

    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100)
        return message.reply("⚠️ Précise un nombre entre 1 et 100.");

    await message.channel.bulkDelete(amount, true);
    message.channel.send(`🧹 **${amount}** messages atomisés.`)
        .then(m => setTimeout(() => m.delete(), 3000));
};