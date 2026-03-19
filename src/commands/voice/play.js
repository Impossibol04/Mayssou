const { EmbedBuilder } = require('discord.js');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const playdl = require('play-dl');
const { musicData, voiceTimeouts, formatDuration, getOrCreateConnection, playNext } = require('../../utils/musicManager');

const SOUNDCLOUD_ICON = "https://developers.soundcloud.com/assets/logo_big_white-65c2b096da68dd533db18b9f07d14054.png";

module.exports = async (client, message, args) => {
    const isKaraoke = args.includes("-k");
    const query = args.join(" ").replace("-k", "").trim();

    if (!query) return message.reply("⚠️ Précise un titre ! (Ajoute `-k` pour le karaoké)");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Tu dois être dans un salon vocal !");

    try {
        const waitMsg = await message.reply("🔍 Recherche en cours...");

        const searchTerm = isKaraoke ? `${query} karaoke instrumental` : query;
        const results = await playdl.search(searchTerm, { source: { soundcloud: "tracks" }, limit: 1 });

        if (!results || results.length === 0) {
            await waitMsg.delete().catch(() => {});
            return message.reply("❌ Aucun résultat trouvé sur SoundCloud.");
        }

        const r = results[0];
        const track = {
            url: r.url,
            title: r.name || "Titre inconnu",
            artist: r.user?.name || "Inconnu",
            duration: formatDuration(r.durationInSec),
            thumbnail: r.thumbnail || null,
            requestedBy: message.author.username,
            isKaraoke,
            query,
        };

        await waitMsg.delete().catch(() => {});

        if (voiceTimeouts.has(message.guild.id)) {
            clearTimeout(voiceTimeouts.get(message.guild.id));
            voiceTimeouts.delete(message.guild.id);
        }

        let data = musicData.get(message.guild.id);

        const isPlaying = data?.player &&
            data.player.state.status !== AudioPlayerStatus.Idle;

        if (isPlaying) {
            data.queue.push(track);
            const queueEmbed = new EmbedBuilder()
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
            return message.channel.send({ embeds: [queueEmbed] });
        }

        const connection = getOrCreateConnection(voiceChannel, message.guild.id);
        const player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play }
        });
        connection.subscribe(player);

        musicData.set(message.guild.id, {
            player, connection, queue: [], currentTrack: track, loop: false, stopped: false
        });
        data = musicData.get(message.guild.id);

        const stream = await playdl.stream(track.url, { quality: 2 });
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true
        });
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

        if (isKaraoke) {
            embed.addFields({
                name: "📖 Paroles",
                value: `[Clique ici](https://www.google.com/search?q=${encodeURIComponent(query + " lyrics")})`
            });
        }

        message.channel.send({ embeds: [embed] });

        player.on('error', error => {
            console.error(`Erreur Player: ${error.message}`);
            message.channel.send("❌ Erreur pendant la lecture.");
        });

        player.on(AudioPlayerStatus.Idle, () => {
            const currentData = musicData.get(message.guild.id);
            if (currentData?.stopped) {
                currentData.stopped = false;
                return;
            }
            playNext(message.guild.id, message.channel);
        });

    } catch (error) {
        console.error("Erreur commande Play:", error);
        message.reply("❌ Impossible de lire la musique.");
    }
};