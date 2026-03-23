const { getVoiceConnection } = require('@discordjs/voice');
const { musicData, voiceTimeouts } = require('../../utils/musicManager');

module.exports = async (client, message, args) => {
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.reply("❌ Je ne suis pas en vocal.");
    const data = musicData.get(message.guild.id);
    if (data) {
        data.queue = [];
        if (data.player) data.player.stop();
        musicData.delete(message.guild.id);
    }
    if (voiceTimeouts.has(message.guild.id)) {
        clearTimeout(voiceTimeouts.get(message.guild.id));
        voiceTimeouts.delete(message.guild.id);
    }
    connection.destroy();
    message.react("👋");
};