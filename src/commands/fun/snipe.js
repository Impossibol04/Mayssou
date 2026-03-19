const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const snipes = client.snipes;
    const msg = snipes?.get(message.channel.id);
    if (!msg) return message.reply("🤷‍♂️ Rien à récupérer.");

    const embed = new EmbedBuilder()
        .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() })
        .setDescription(msg.content || "*Média*")
        .setColor("#e74c3c")
        .setFooter({ text: `Détecté à ${msg.date.toLocaleTimeString()}` });

    if (msg.image) embed.setImage(msg.image);
    message.channel.send({ embeds: [embed] });
};