const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const snipes = client.snipes;
    const msg = snipes?.get(message.channel.id);

    if (!msg) return message.reply("🤷‍♂️ Rien à récupérer.");

    const embed = new EmbedBuilder()
        .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
        .setColor("#e74c3c")
        .setFooter({ text: `Supprimé à ${msg.date.toLocaleTimeString()}` });

    // Si le message contient du texte
    if (msg.content) embed.setDescription(msg.content);

    // C'EST CETTE LIGNE QUI FAIT APPARAÎTRE LE GIF/IMAGE
    if (msg.image) embed.setImage(msg.image);

    message.channel.send({ embeds: [embed] });
};