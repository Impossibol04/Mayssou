const { musicData, playNext } = require('../../utils/musicManager');

function sameVoice(message) {
    const vc = message.member.voice.channel;
    const botVc = message.guild.members.me?.voice?.channel;
    return vc && botVc && vc.id === botVc.id;
}

module.exports = async (client, message, args) => {
    if (!sameVoice(message)) return message.reply('❌ Rejoins le **même salon vocal** que le bot.');

    const n = parseInt(args[0], 10);
    const data = musicData.get(message.guild.id);
    if (!data?.player) return message.reply('⚠️ Aucune musique en cours.');

    if (isNaN(n) || n < 1 || n > (data.queue?.length || 0))
        return message.reply(`⚠️ \`skipto <1-${data.queue?.length || 0}>\` — position dans la **file** (sans la piste en cours).`);

    data.queue.splice(0, n - 1);
    data.loop = false;
    data.stopped = false;
    data.player.stop();
    message.react('⏭️').catch(() => {});
};
