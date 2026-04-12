const { AudioPlayerStatus, entersState } = require('@discordjs/voice');
const playdl = require('play-dl');
const { createAudioResource } = require('@discordjs/voice');
const { musicData } = require('../../utils/musicManager');

function sameVoice(message) {
    const vc = message.member.voice.channel;
    const botVc = message.guild.members.me?.voice?.channel;
    return vc && botVc && vc.id === botVc.id;
}

function parseSeekArg(raw) {
    if (!raw) return NaN;
    if (/^\d+$/.test(raw)) return parseInt(raw, 10);
    const m = raw.match(/^(\d+):(\d{1,2})$/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    return NaN;
}

module.exports = async (client, message, args) => {
    if (!sameVoice(message)) return message.reply('❌ Rejoins le **même salon vocal** que le bot.');

    const data = musicData.get(message.guild.id);
    if (!data?.player || !data.currentTrack) return message.reply('⚠️ Aucune musique en cours.');

    const sec = parseSeekArg((args[0] || '').trim());
    if (isNaN(sec) || sec < 0) return message.reply('⚠️ Utilisation : `seek <secondes>` ou `seek mm:ss`');

    const max = data.currentTrack.durationInSec || 0;
    if (max > 0 && sec > max) return message.reply(`⚠️ La piste dure ~**${max}s**.`);

    try {
        data.suppressIdleAdvance = true;
        data.player.stop();
        await entersState(data.player, AudioPlayerStatus.Idle, 8000).catch(() => {});

        const stream = await playdl.stream(data.currentTrack.url, { quality: 2, seek: sec });
        const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
        resource.volume.setVolume(Math.min(2, Math.max(0, (data.volume ?? 100) / 100)));
        data.player.play(resource);
        data.suppressIdleAdvance = false;
        message.reply(`⏩ Seek à **${sec}s**.`);
    } catch (e) {
        data.suppressIdleAdvance = false;
        console.error('seek:', e);
        message.reply(`❌ Seek impossible : ${e.message || 'erreur'}`);
    }
};
