const Genius = require('genius-lyrics');
const client = new Genius.Client();

async function getLyrics(title, artist) {
    try {
        const searches = await client.songs.search(`${title} ${artist}`);
        if (!searches || searches.length === 0) return null;
        const song = searches[0];
        const lyrics = await song.lyrics();
        return { lyrics, title: song.title, artist: song.artist.name, url: song.url };
    } catch (err) {
        console.error("Erreur Genius:", err.message);
        return null;
    }
}

function splitLyrics(lyrics) {
    const chunks = [];
    const lines = lyrics.split('\n');
    let current = '';
    for (const line of lines) {
        if ((current + '\n' + line).length > 1000) {
            chunks.push(current.trim());
            current = line;
        } else {
            current += '\n' + line;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
}

module.exports = { getLyrics, splitLyrics };