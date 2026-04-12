const {
    createAudioResource,
    getVoiceConnection,
    joinVoiceChannel,
} = require('@discordjs/voice');
const playdl = require('play-dl');

const SOUNDCLOUD_ICON = "https://developers.soundcloud.com/assets/logo_big_white-65c2b096da68dd533db18b9f07d14054.png";
const musicData = new Map();
const voiceTimeouts = new Map();

function formatDuration(seconds) {
    seconds = Math.floor(seconds || 0);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getOrCreateConnection(voiceChannel, guildId) {
    const existing = getVoiceConnection(guildId);
    if (existing) return existing;
    return joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
}

async function tryAutoplayTrack(guildId, channel, data) {
    if (!data.autoplay || !data.currentTrack?.artist) return false;
    try {
        const q = `${data.currentTrack.artist}`.slice(0, 60);
        const results = await playdl.search(q, { source: { soundcloud: 'tracks' }, limit: 3 });
        if (!results?.length) return false;
        const pick = results.find((r) => r.url !== data.currentTrack.url) || results[0];
        const dur = pick.durationInSec || 0;
        data.queue.push({
            url: pick.url,
            title: pick.name || 'Sans titre',
            artist: pick.user?.name || 'Inconnu',
            duration: formatDuration(dur),
            durationInSec: dur,
            thumbnail: pick.thumbnail || null,
            requestedBy: 'Autoplay',
            isKaraoke: false,
        });
        return true;
    } catch (e) {
        console.error('[autoplay]', e.message);
        return false;
    }
}

async function playNext(guildId, channel) {
    const data = musicData.get(guildId);
    if (!data) return;
    if (data.suppressIdleAdvance) return;
    if (data.stopped) return;
    if (data.loop && data.currentTrack) data.queue.unshift(data.currentTrack);

    if (data.queue.length === 0) {
        const autoplayed = await tryAutoplayTrack(guildId, channel, data);
        if (autoplayed && data.queue.length > 0) return playNext(guildId, channel);

        data.currentTrack = null;
        const timeout = setTimeout(() => {
            const connection = getVoiceConnection(guildId);
            if (connection) connection.destroy();
            musicData.delete(guildId);
        }, 5 * 60 * 1000);
        voiceTimeouts.set(guildId, timeout);
        return;
    }

    const track = data.queue.shift();
    data.currentTrack = track;

    try {
        const stream = await playdl.stream(track.url, { quality: 2 });
        const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
        const vol = Math.min(2, Math.max(0, (data.volume ?? 100) / 100));
        resource.volume.setVolume(vol);
        data.player.play(resource);

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setAuthor({ name: "SoundCloud", iconURL: SOUNDCLOUD_ICON })
            .setTitle("🎵 Musique suivante")
            .setDescription(`[${track.title}](${track.url})`)
            .setThumbnail(track.thumbnail)
            .setColor("#FF5500")
            .addFields(
                { name: "🎤 Artiste", value: track.artist || "Inconnu", inline: true },
                { name: "⏱️ Durée", value: track.duration, inline: true }
            )
            .setTimestamp();
        channel.send({ embeds: [embed] });
    } catch (err) {
        console.error("Erreur playNext:", err);
        channel.send("❌ Erreur, passage au suivant...");
        playNext(guildId, channel);
    }
}

module.exports = {
    musicData,
    voiceTimeouts,
    formatDuration,
    getOrCreateConnection,
    playNext,
    tryAutoplayTrack,
    SOUNDCLOUD_ICON,
};