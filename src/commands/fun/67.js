const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const gifUrl = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExemNpMjJ3MnBuZ2R1NHQ3Nm9tZHN1NDcyM2FxdHZhcDhxZ29odDI0eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/RVCJ3vwebUGDpoy7Tm/giphy.gif";
    const embed = new EmbedBuilder()
        .setColor('#000000')
        .setTitle('🥀 SIX SEVEEEN !')
        .setImage(gifUrl)
        .setTimestamp();
    message.channel.send({ embeds: [embed] });
};