const { getAfk, setAfk, clearAfk } = require('../../utils/afkStore');

module.exports = async (client, message, args) => {
    const reason = args.join(' ').trim() || 'AFK';
    if (reason.length > 200) return message.reply('❌ Raison trop longue (200 max).');

    setAfk(message.guild.id, message.author.id, reason);
    message.reply(`💤 **AFK** : ${reason}`);
};
