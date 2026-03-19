const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    const avatarUrl = user.displayAvatarURL({ size: 1024, dynamic: true });
    const embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setAuthor({ name: user.username, iconURL: avatarUrl })
        .setImage(avatarUrl);
    message.channel.send({ embeds: [embed] });
};