const { musicData } = require('../../utils/musicManager');

function sameVoice(message) {
    const vc = message.member.voice.channel;
    const botVc = message.guild.members.me?.voice?.channel;
    return vc && botVc && vc.id === botVc.id;
}

module.exports = async (client, message, args) => {
    if (!sameVoice(message)) return message.reply('❌ Rejoins le **même salon vocal** que le bot.');

    const data = musicData.get(message.guild.id);
    if (!data?.queue?.length) return message.reply('⚠️ La file est vide.');

    const n = parseInt(args[0], 10);
    if (isNaN(n) || n < 1 || n > data.queue.length)
        return message.reply(`⚠️ Utilisation : \`remove <1-${data.queue.length}>\` (position dans la file).`);

    const [removed] = data.queue.splice(n - 1, 1);
    message.reply(`🗑️ Retiré **#${n}** : **${removed.title}**.`);
};
