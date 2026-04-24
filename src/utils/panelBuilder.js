const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function createMusicPanel(data) {
    const track = data.currentTrack;
    if (!track) return { content: "⚠️ Aucune musique en cours." };

    const embed = new EmbedBuilder()
        .setTitle(`🎵 En lecture : ${track.title}`)
        .setURL(track.url)
        .setThumbnail(track.thumbnail)
        .setColor('#FF5500')
        .addFields(
            { name: '🎤 Artiste', value: track.artist || 'Inconnu', inline: true },
            { name: '⏱️ Durée', value: track.duration || '00:00', inline: true },
            { name: '👤 Par', value: `${track.requestedBy}`, inline: true },
            { name: '⚙️ État', value: `🔊 ${data.volume}% | Loop: ${data.loop ? '✅' : '❌'} | Auto: ${data.autoplay ? '✅' : '❌'}`, inline: false }
        );

    // Ligne 1 : Navigation
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_replay').setEmoji('⏮️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_pause').setEmoji('⏯️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
    );

    // Ligne 2 : Options
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('music_shuffle').setEmoji('🔀').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(data.loop ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_autoplay').setEmoji('🎲').setStyle(data.autoplay ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('music_queue').setEmoji('📋').setStyle(ButtonStyle.Secondary)
    );

    return { embeds: [embed], components: [row1, row2] };
}

module.exports = { createMusicPanel };