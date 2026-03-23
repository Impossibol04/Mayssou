const { musicData } = require('../../utils/musicManager');

module.exports = async (client, message, args) => {
    const data = musicData.get(message.guild.id);
    if (!data || !data.player) return message.reply("⚠️ Aucune musique en cours.");
    data.loop = !data.loop;
    message.react(data.loop ? "🔁" : "➡️");
    message.reply(data.loop ? "🔁 Loop activé !" : "➡️ Loop désactivé !");
};