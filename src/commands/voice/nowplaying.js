const { musicData } = require('../../utils/musicManager');
// Importe le panelBuilder que nous avons créé ensemble
const { createMusicPanel } = require('../../utils/panelBuilder'); 

module.exports = async (client, message, args) => {
    try {
        const data = musicData.get(message.guild.id);

        // Si rien ne joue, on répond gentiment sans faire crash le bot
        if (!data || !data.currentTrack) {
            return message.reply('⚠️ Aucune musique en cours de lecture.');
        }

        // On génère le panel
        const panel = createMusicPanel(data);
        
        // On l'envoie
        await message.channel.send(panel);
    } catch (error) {
        console.error("Erreur dans nowplaying:", error);
        message.reply("❌ Une erreur est survenue lors de l'affichage du panel.");
    }
};