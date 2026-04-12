const { EmbedBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { musicData, SOUNDCLOUD_ICON } = require('../../utils/musicManager');

module.exports = async (client, message, args) => {
    const data = musicData.get(message.guild.id);
    if (!data?.currentTrack) return message.reply('⚠️ Aucune musique en cours.');

    const playing = data.player?.state?.status === AudioPlayerStatus.Playing;
    const embed = new EmbedBuilder()
        .setAuthor({ name: 'SoundCloud', iconURL: SOUNDCLOUD_ICON })
        .setTitle(playing ? '🎵 Lecture en cours' : '⏸️ En pause / en attente')
        .setDescription(`[${data.currentTrack.title}](${data.currentTrack.url})`)
        .setThumbnail(data.currentTrack.thumbnail)
        .setColor('#FF5500')
        .addFields(
            { name: '🎤 Artiste', value: data.currentTrack.artist || '—', inline: true },
            { name: '⏱️ Durée', value: data.currentTrack.duration || '—', inline: true },
            { name: '🔊 Volume', value: `${data.volume ?? 100}%`, inline: true },
            { name: '👤 Demandé par', value: data.currentTrack.requestedBy || '—', inline: true },
            { name: '🔁 Loop', value: data.loop ? 'Oui' : 'Non', inline: true },
            { name: '📋 File', value: `${data.queue?.length ?? 0} titre(s)`, inline: true }
        )
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};

module.exports.aliases = ['np'];
