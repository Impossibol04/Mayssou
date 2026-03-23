const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    // On crée l'embed de chargement
    const msg = await message.reply("🏓 Calcul du ping...");

    const ping = msg.createdTimestamp - message.createdTimestamp;
    const apiPing = client.ws.ping;

    const embed = new EmbedBuilder()
        .setTitle("🏓 Pong !")
        .setColor("#0099ff")
        .addFields(
            { name: "🤖 Latence du Bot", value: `\`${ping}ms\``, inline: true },
            { name: "💻 Latence API", value: `\`${apiPing}ms\``, inline: true }
        )
        .setFooter({ text: `Demandé par ${message.author.tag}` })
        .setTimestamp();

    await msg.edit({ content: null, embeds: [embed] });
};