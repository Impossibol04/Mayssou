const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const user = message.mentions.users.first() || message.author;
    await user.fetch();
    const bannerUrl = user.bannerURL({ size: 1024, dynamic: true });
    if (!bannerUrl) return message.reply(`❌ **${user.username}** n'a pas de bannière personnalisée.`);
    const embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setImage(bannerUrl);
    message.channel.send({ embeds: [embed] });
};