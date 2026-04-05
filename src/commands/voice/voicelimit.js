const {
    buildVoicelimitButtonRow,
    applyVoiceUserLimit,
} = require('../../components/voiceLimitShared');

module.exports = async (client, message, args) => {
    const limit = parseInt(args[0], 10);

    if (Number.isNaN(limit) || limit < 0 || limit > 99) {
        return message.reply("⚠️ Utilisation : `+voicelimit <nombre>` (0 = illimité, max 99)");
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Tu dois être dans un salon vocal !");

    const result = await applyVoiceUserLimit(client, message.author.id, voiceChannel, limit);
    if (!result.ok) return message.reply(result.error);

    try {
        await message.react("✅");
        const text = result.limit === 0
            ? "🔓 Salon illimité !"
            : `👥 Limite fixée à **${result.limit} personne(s)** !`;
        await message.channel.send({
            content: text,
            components: [buildVoicelimitButtonRow(voiceChannel.id)],
        });
    } catch (err) {
        console.error(err);
        message.reply("❌ Impossible d’envoyer la confirmation.");
    }
};
