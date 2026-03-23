const { EmbedBuilder } = require('discord.js');
const { musicData } = require('../../utils/musicManager');

module.exports = async (client, message, args) => {
    const data = musicData.get(message.guild.id);
    if (!data || (!data.currentTrack && data.queue.length === 0)) return message.reply("📋 Aucune musique en cours.");

    const embed = new EmbedBuilder()
        .setTitle("📋 File d'attente")
        .setColor("#FF5500")
        .setTimestamp();

    if (data.currentTrack) {
        embed.addFields({
            name: `🎵 En cours${data.loop ? " 🔁" : ""}`,
            value: `[${data.currentTrack.title}](${data.currentTrack.url}) — ${data.currentTrack.duration}`
        });
    }

    if (data.queue.length > 0) {
        const list = data.queue.slice(0, 10)
            .map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) — ${t.duration} — par ${t.requestedBy}`)
            .join('\n');
        embed.addFields({ name: `📋 Suivants (${data.queue.length})`, value: list });
        embed.setFooter({ text: `${data.queue.length} musique(s) en attente` });
    }

    message.channel.send({ embeds: [embed] });
};

module.exports.aliases = ['q'];