const { musicData, playNext } = require('../../utils/musicManager');

module.exports = async (client, message, args) => {
    if (!message.member.voice.channel) return message.reply("❌ Tu dois être dans le salon vocal !");
    const data = musicData.get(message.guild.id);
    if (!data || !data.player) return message.reply("⚠️ Aucune musique en cours.");
    if (data.queue.length === 0 && !data.stopped) return message.reply("⚠️ Pas de musique suivante !");
    data.loop = false;
    data.stopped = false;
    if (data.currentTrack) { data.player.stop(); } else { playNext(message.guild.id, message.channel); }
    message.react("⏭️");
};