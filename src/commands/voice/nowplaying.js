const { musicData } = require('../../utils/musicManager');
const { createMusicPanel } = require('../../utils/panelBuilder');

module.exports = async (client, message, args) => {
    const data = musicData.get(message.guild.id);
    if (!data?.currentTrack) return message.reply('⚠️ Aucune musique en cours.');

    const panel = createMusicPanel(data);
    await message.channel.send(panel);
};