module.exports = async (client, message, args) => {
    const limit = parseInt(args[0]);

    if (isNaN(limit) || limit < 0 || limit > 99)
        return message.reply("⚠️ Utilisation : `+voicelimit <nombre>` (0 = illimité, max 99)");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Tu dois être dans un salon vocal !");

    const tempVoices = client.tempVoices;
    if (!tempVoices?.has(voiceChannel.id)) return message.reply("❌ Tu ne peux modifier que ton propre vocal temporaire !");
    if (tempVoices.get(voiceChannel.id) !== message.author.id) return message.reply("❌ Ce n'est pas ton vocal !");

    try {
        await voiceChannel.setUserLimit(limit);
        message.react("✅");
        message.channel.send(limit === 0
            ? "🔓 Salon illimité !"
            : `👥 Limite fixée à **${limit} personne(s)** !`
        );
    } catch (err) {
        console.error("Erreur limit vocal:", err);
        message.reply("❌ Impossible de modifier la limite.");
    }
};