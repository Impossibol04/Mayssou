const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const embed = new EmbedBuilder()
        .setTitle(message.guild.name)
        .setThumbnail(message.guild.iconURL())
        .addFields(
            { name: "👑 Propriétaire", value: `<@${message.guild.ownerId}>`, inline: true },
            { name: "👥 Membres", value: `\`${message.guild.memberCount}\``, inline: true },
            { name: "📅 Création", value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:d>`, inline: true }
        )
        .setColor("Gold")
        .setFooter({ text: `Demandé par ${message.author.tag}` })
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};