const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    const name = args.join(" ").trim();
    if (!name) return message.reply("⚠️ Utilisation : `+voicename <nouveau nom>`");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Tu dois être dans un salon vocal !");

    // Vérifie que c'est bien son vocal temporaire
    const tempVoices = client.tempVoices;
    if (!tempVoices?.has(voiceChannel.id)) return message.reply("❌ Tu ne peux renommer que ton propre vocal temporaire !");
    if (tempVoices.get(voiceChannel.id) !== message.author.id) return message.reply("❌ Ce n'est pas ton vocal !");

    if (name.length > 32) return message.reply("❌ Le nom ne peut pas dépasser 32 caractères.");

    try {
        await voiceChannel.setName(`🔊 ${name}`);
        message.react("✅");
    } catch (err) {
        console.error("Erreur renommage vocal:", err);
        message.reply("❌ Impossible de renommer le salon.");
    }
};