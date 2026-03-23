const { createAudioResource, StreamType, getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const https = require('https');

function fetchStream(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => resolve(res)).on('error', reject);
    });
}

module.exports = async (client, message, args) => {
    const text = args.join(" ");
    if (!text) return message.reply("⚠️ Utilisation : `+tts Ton texte ici`");
    if (text.length > 1000) return message.reply("❌ Texte trop long (max 1000 caractères).");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Tu dois être dans un salon vocal !");

    try {
        // Récupère toutes les URLs (découpe automatiquement en morceaux de 200 chars)
        const urls = googleTTS.getAllAudioUrls(text, { lang: 'fr', slow: false, splitPunct: ',.!?' });

        let connection = getVoiceConnection(message.guild.id);
        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
        }

        const player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play }
        });
        connection.subscribe(player);
        message.react("🔊");

        // Joue les morceaux à la suite
        let index = 0;
        const playNext = async () => {
            if (index >= urls.length) return;
            const res = await fetchStream(urls[index].url);
            const resource = createAudioResource(res, { inputType: StreamType.Arbitrary });
            player.play(resource);
            index++;
        };

        player.on(AudioPlayerStatus.Idle, playNext);
        player.on('error', err => console.error("Erreur TTS:", err));

        await playNext();

    } catch (error) {
        console.error("Erreur TTS:", error);
        message.reply("❌ Erreur lors de la synthèse vocale.");
    }
};

module.exports.aliases = ['say'];