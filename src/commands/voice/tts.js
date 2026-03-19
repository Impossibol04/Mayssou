const { createAudioResource, StreamType, getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const https = require('https');

module.exports = async (client, message, args) => {
    const text = args.join(" ");
    if (!text) return message.reply("⚠️ Utilisation : `+tts Ton texte ici`");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Tu dois être dans un salon vocal !");

    try {
        const url = googleTTS.getAudioUrl(text, { lang: 'fr', slow: false });

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

        https.get(url, (res) => {
            const resource = createAudioResource(res, { inputType: StreamType.Arbitrary });
            player.play(resource);
            message.react("🔊");
        });

    } catch (error) {
        console.error("Erreur TTS:", error);
        message.reply("❌ Erreur lors de la synthèse vocale.");
    }
};