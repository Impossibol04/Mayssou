// src/commands/voice/tts.js
const {
    createAudioResource,
    StreamType,
    getVoiceConnection,
    joinVoiceChannel,
    createAudioPlayer,
    NoSubscriberBehavior,
    AudioPlayerStatus,
} = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const https = require('https');
const { musicData } = require('../../utils/musicManager');

function fetchStream(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            resolve(res);
        }).on('error', reject);
    });
}

module.exports = async (client, message, args) => {
    const text = args.join(' ');
    if (!text) return message.reply('⚠️ Utilisation : `+tts Ton texte ici`');
    if (text.length > 1000) return message.reply('❌ Texte trop long (max 1000 caractères).');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('❌ Tu dois être dans un salon vocal !');

    // ── Bloque le TTS si une musique est en cours ─────────────────────────────
    const musicState = musicData.get(message.guild.id);
    if (musicState?.player && musicState.player.state.status !== AudioPlayerStatus.Idle) {
        return message.reply('❌ Une musique est en cours de lecture. Arrête-la avec `+stop` avant d\'utiliser le TTS.');
    }

    try {
        const urls = googleTTS.getAllAudioUrls(text, {
            lang: 'fr',
            slow: false,
            splitPunct: ',.!?',
        });

        if (!urls || urls.length === 0) return message.reply('❌ Impossible de générer l\'audio.');

        let connection = getVoiceConnection(message.guild.id);
        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
        }
        
        const player = createAudioPlayer({
            behaviors: { noSubscriber: NoSubscriberBehavior.Play },
        });
        connection.subscribe(player);
        message.react('🔊').catch(() => {});

        let index = 0;

        const playNextChunk = async () => {
            if (index >= urls.length) return;
            try {
                const res = await fetchStream(urls[index].url);
                const resource = createAudioResource(res, { inputType: StreamType.Arbitrary });
                player.play(resource);
                index++;
            } catch (err) {
                console.error('Erreur TTS chunk:', err.message);
                index++;
                await playNextChunk(); // passe au chunk suivant si un échoue
            }
        };

        player.on(AudioPlayerStatus.Idle, playNextChunk);
        player.on('error', err => console.error('Erreur player TTS:', err.message));

        await playNextChunk();

    } catch (error) {
        console.error('Erreur TTS:', error);
        message.reply('❌ Erreur lors de la synthèse vocale.');
    }
};

module.exports.aliases = ['say'];