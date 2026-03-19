const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const question = args.join(" ");
    if (!question) return message.reply("⚠️ Utilisation : `+poll Ta question ici`");

    const embed = new EmbedBuilder()
        .setTitle("📊 SONDAGE")
        .setDescription(question)
        .setColor("Random")
        .setFooter({ text: `Sondage par ${message.author.username}` })
        .setTimestamp();

    const m = await message.channel.send({ embeds: [embed] });
    m.react("✅");
    m.react("❌");
};