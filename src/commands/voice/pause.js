const { AudioPlayerStatus } = require('@discordjs/voice');
const { musicData } = require('../../utils/musicManager');

module.exports = async (client, message, args) => {
    if (!message.member.voice.channel) return message.reply("❌ Tu dois être dans le salon vocal !");
    const data = musicData.get(message.guild.id);
    if (!data || !data.player) return message.reply("⚠️ Aucune musique en cours.");

    if (data.player.state.status === AudioPlayerStatus.Paused) {
        data.player.unpause();
        message.react("▶️");
        message.channel.send("▶️ Musique reprise !");
    } else if (data.player.state.status === AudioPlayerStatus.Playing) {
        data.player.pause();
        message.react("⏸️");
        message.channel.send("⏸️ Musique en pause !");
    } else {
        message.reply("⚠️ Aucune musique en cours.");
    }
};

module.exports.aliases = ['resume'];