const { AudioPlayerStatus, entersState, createAudioResource } = require('@discordjs/voice');
const playdl = require('play-dl');
const { musicData } = require('../../utils/musicManager');

function sameVoice(message) {
    const vc = message.member.voice.channel;
    const botVc = message.guild.members.me?.voice?.channel;
    return vc && botVc && vc.id === botVc.id;
}

module.exports = async (client, message, args) => {
    if (!sameVoice(message)) return message.reply('❌ Rejoins le **même salon vocal** que le bot.');

    const data = musicData.get(message.guild.id);
    if (!data?.player || !data.currentTrack) return message.reply('⚠️ Aucune piste en cours.');

    try {
        data.suppressIdleAdvance = true;
        data.player.stop();
        await entersState(data.player, AudioPlayerStatus.Idle, 8000).catch(() => {});

        const stream = await playdl.stream(data.currentTrack.url, { quality: 2, seek: 0 });
        const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
        resource.volume.setVolume(Math.min(2, Math.max(0, (data.volume ?? 100) / 100)));
        data.player.play(resource);
        data.suppressIdleAdvance = false;
        message.reply('🔁 Relance depuis le début.');
    } catch (e) {
        data.suppressIdleAdvance = false;
        console.error('replay:', e);
        message.reply(`❌ Replay impossible : ${e.message || 'erreur'}`);
    }
};
