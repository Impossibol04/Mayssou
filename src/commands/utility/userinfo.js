const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const target = message.mentions.members.first() || message.member;

    // Liste des rôles triés du plus haut au plus bas, sans @everyone
    const roles = target.roles.cache
        .filter(r => r.id !== message.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => `${r}`)
        .join(', ') || 'Aucun rôle';

    const embed = new EmbedBuilder()
        .setTitle(`Analyse de ${target.user.username}`)
        .setThumbnail(target.user.displayAvatarURL())
        .addFields(
            { name: "🆔 ID", value: `\`${target.id}\``, inline: true },
            { name: "🗓️ Création", value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
            { name: "📥 Arrivée", value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
            { name: "⭐ Rôle Max", value: `${target.roles.highest}`, inline: true },
            { name: `🎭 Rôles (${target.roles.cache.size - 1})`, value: roles, inline: false }
        )
        .setColor("Blue")
        .setFooter({ text: `Demandé par ${message.author.tag}` })
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};