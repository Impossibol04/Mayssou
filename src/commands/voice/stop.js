const { musicData } = require('../../utils/musicManager');

module.exports = async (client, message, args) => {
    if (!message.member.voice.channel) return message.reply("❌ Tu dois être dans le salon vocal !");
    const data = musicData.get(message.guild.id);
    if (!data || !data.player) return message.reply("⚠️ Aucune musique en cours.");

    data.loop = false;
    data.stopped = true; // empêche playNext de se déclencher
    data.player.stop();
    data.currentTrack = null;
    message.react("🛑");
};