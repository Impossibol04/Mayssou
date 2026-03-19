const { EmbedBuilder } = require('discord.js');
const { musicData } = require('../../utils/musicManager');

module.exports = async (client, message, args) => {
    const data = musicData.get(message.guild.id);
    if (!data || (!data.currentTrack && data.queue.length === 0))
        return message.reply("📋 Aucune musique en cours.");

    const embed = new EmbedBuilder()
        .setTitle("📋 File d'attente")
        .setColor("#0099FF")
        .setTimestamp();

    if (data.currentTrack) {
        embed.addFields({
            name: `🎵 En cours${data.loop ? " 🔁" : ""}`,
            value: `[${data.currentTrack.title}](${data.currentTrack.url}) — ${data.currentTrack.duration}`
        });
    }

    // Affiche la file seulement s'il y a des musiques en attente
    if (data.queue.length > 0) {
        const queueList = data.queue.slice(0, 10)
            .map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) — ${t.duration} — par ${t.requestedBy}`)
            .join('\n');
        embed.addFields({ name: `📋 Suivants (${data.queue.length})`, value: queueList });
        embed.setFooter({ text: `${data.queue.length} musique(s) en attente` });
    }

    message.channel.send({ embeds: [embed] });
};

module.exports.aliases = ['q'];