const { AudioPlayerStatus } = require('@discordjs/voice');
const { musicData } = require('../../utils/musicManager');

function sameVoice(message) {
    const vc = message.member.voice.channel;
    const botVc = message.guild.members.me?.voice?.channel;
    return vc && botVc && vc.id === botVc.id;
}

module.exports = async (client, message, args) => {
    if (!sameVoice(message)) return message.reply('❌ Rejoins le **même salon vocal** que le bot.');

    const data = musicData.get(message.guild.id);
    if (!data?.player) return message.reply('⚠️ Aucune musique en cours.');

    if (!args[0]) {
        return message.reply(`🔊 Volume actuel : **${data.volume ?? 100}%** — \`volume <0-200>\` (100 = défaut).`);
    }

    const v = parseInt(args[0], 10);
    if (isNaN(v) || v < 0 || v > 200) return message.reply('⚠️ Utilisation : `volume <0-200>`');

    data.volume = v;
    const res = data.player.state.resource;
    if (res?.volume) res.volume.setVolume(Math.min(2, Math.max(0, v / 100)));

    const status = data.player.state.status;
    message.reply(`🔊 Volume réglé sur **${v}%**${status === AudioPlayerStatus.Paused ? ' (en pause)' : ''}.`);
};
