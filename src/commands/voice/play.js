const { EmbedBuilder } = require('discord.js');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const playdl = require('play-dl');
const { musicData, voiceTimeouts, formatDuration, getOrCreateConnection, playNext, SOUNDCLOUD_ICON } = require('../../utils/musicManager');
const { getLyrics, splitLyrics } = require('../../utils/lyrics');
process.env.FFMPEG_PATH = require('ffmpeg-static');

// Recherche avec retry automatique
async function searchWithRetry(query, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const results = await playdl.search(query, { source: { soundcloud: "tracks" }, limit: 1 });
            if (results && results.length > 0) return results;
        } catch (err) {
            console.error(`Tentative ${i + 1} échouée:`, err.message);
            if (i < retries - 1) {
                // Renouvelle le client ID avant de réessayer
                const clientId = await playdl.getFreeClientID();
                await playdl.setToken({ soundcloud: { client_id: clientId } });
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
    throw new Error("Aucun résultat trouvé après plusieurs tentatives");
}

module.exports = async (client, message, args) => {
    const isKaraoke = args[0] === '-k';
    const query = isKaraoke ? args.slice(1).join(" ").trim() : args.join(" ").trim();

    if (!query) return message.reply("⚠️ Utilisation : `+play <titre>` ou `+play -k <titre>` pour le karaoké");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Tu dois être dans un salon vocal !");

    try {
        const waitMsg = await message.reply("🔍 Recherche sur **SoundCloud**...");
        const searchTerm = isKaraoke ? `${query} karaoke instrumental` : query;
        const results = await searchWithRetry(searchTerm);

        const r = results[0];
        const track = {
            url: r.url,
            title: r.name || "Titre inconnu",
            artist: r.user?.name || "Inconnu",
            duration: formatDuration(r.durationInSec),
            thumbnail: r.thumbnail || null,
            requestedBy: message.author.username,
            isKaraoke,
        };

        await waitMsg.delete().catch(() => {});

        if (voiceTimeouts.has(message.guild.id)) {
            clearTimeout(voiceTimeouts.get(message.guild.id));
            voiceTimeouts.delete(message.guild.id);
        }

        let data = musicData.get(message.guild.id);
        const isPlaying = data?.player && data.player.state.status !== AudioPlayerStatus.Idle;

        if (isPlaying) {
            data.queue.push(track);
            const embed = new EmbedBuilder()
                .setAuthor({ name: "SoundCloud", iconURL: SOUNDCLOUD_ICON })
                .setTitle("📋 Ajouté à la file d'attente")
                .setDescription(`[${track.title}](${track.url})`)
                .setThumbnail(track.thumbnail)
                .setColor("#FF5500")
                .addFields(
                    { name: "🎤 Artiste", value: track.artist, inline: true },
                    { name: "⏱️ Durée", value: track.duration, inline: true },
                    { name: "📋 Position", value: `\`#${data.queue.length}\``, inline: true }
                )
                .setFooter({ text: `Demandé par ${track.requestedBy}` })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        const connection = getOrCreateConnection(voiceChannel, message.guild.id);
        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
        connection.subscribe(player);

        musicData.set(message.guild.id, { player, connection, queue: [], currentTrack: track, loop: false, stopped: false });
        data = musicData.get(message.guild.id);

        const stream = await playdl.stream(track.url, { quality: 2 });
        const resource = createAudioResource(stream.stream, { inputType: stream.type, inlineVolume: true });
        resource.volume.setVolume(1);
        player.play(resource);

        const embed = new EmbedBuilder()
            .setAuthor({ name: "SoundCloud", iconURL: SOUNDCLOUD_ICON })
            .setTitle(isKaraoke ? "🎤 Mode Karaoké" : "🎵 Musique en cours")
            .setDescription(`[${track.title}](${track.url})`)
            .setThumbnail(track.thumbnail)
            .setColor("#FF5500")
            .addFields(
                { name: "🎤 Artiste", value: track.artist, inline: true },
                { name: "⏱️ Durée", value: track.duration, inline: true },
                { name: "👤 Demandé par", value: track.requestedBy, inline: true }
            )
            .setTimestamp();
        message.channel.send({ embeds: [embed] });

        if (isKaraoke) {
            const result = await getLyrics(track.title, track.artist);
            if (result) {
                const chunks = splitLyrics(result.lyrics);
                for (let i = 0; i < chunks.length; i++) {
                    const lyricsEmbed = new EmbedBuilder()
                        .setColor("#FF00FF")
                        .setTitle(i === 0 ? `📖 ${result.title} — ${result.artist}` : `📖 Suite (${i + 1})`)
                        .setDescription(chunks[i])
                        .setURL(result.url);
                    await message.channel.send({ embeds: [lyricsEmbed] });
                }
            } else {
                message.channel.send(`📖 Paroles introuvables. [Chercher sur Genius](https://genius.com/search?q=${encodeURIComponent(query)})`);
            }
        }

        player.on('error', error => {
            console.error(`Erreur Player: ${error.message}`);
            message.channel.send("❌ Erreur pendant la lecture.");
        });

        player.on(AudioPlayerStatus.Idle, () => {
            const currentData = musicData.get(message.guild.id);
            if (currentData?.stopped) { currentData.stopped = false; return; }
            playNext(message.guild.id, message.channel);
        });

    } catch (error) {
        console.error("Erreur play:", error);
        message.reply(`❌ Impossible de lire : ${error.message}`);
    }
};