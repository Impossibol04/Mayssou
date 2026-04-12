const { EmbedBuilder } = require('discord.js');
const { musicData } = require('../../utils/musicManager');
const { getLyrics, splitLyrics } = require('../../utils/lyrics');

module.exports = async (client, message, args) => {
    let title;
    let artist;
    if (args.length) {
        const q = args.join(' ');
        const parts = q.split(/\s+-\s+|\s+—\s+/);
        if (parts.length >= 2) {
            title = parts[0].trim();
            artist = parts.slice(1).join(' - ').trim();
        } else {
            title = q;
            artist = '';
        }
    } else {
        const data = musicData.get(message.guild.id);
        if (!data?.currentTrack) return message.reply('⚠️ Rien en lecture — précise : `lyrics <titre> - <artiste>` ou lance `play`.');
        title = data.currentTrack.title;
        artist = data.currentTrack.artist || '';
    }

    const wait = await message.reply('🔍 Recherche des paroles…');
    const result = await getLyrics(title, artist);
    await wait.delete().catch(() => {});

    if (!result) {
        const q = encodeURIComponent(`${title} ${artist}`.trim());
        return message.reply(`📖 Paroles introuvables. [Chercher sur Genius](https://genius.com/search?q=${q})`);
    }

    const chunks = splitLyrics(result.lyrics);
    for (let i = 0; i < Math.min(chunks.length, 3); i++) {
        const embed = new EmbedBuilder()
            .setColor('#FF00FF')
            .setTitle(i === 0 ? `📖 ${result.title} — ${result.artist}` : `📖 Suite (${i + 1}/${chunks.length})`)
            .setDescription(chunks[i])
            .setURL(result.url);
        await message.channel.send({ embeds: [embed] });
    }
    if (chunks.length > 3) {
        message.channel.send(`… **${chunks.length - 3}** autre(s) partie(s) tronquée(s) ici (trop long pour Discord).`);
    }
};
