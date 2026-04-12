const { EmbedBuilder } = require('discord.js');
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
        await message.react('✅');
        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setAuthor({ name: 'Limite du vocal', iconURL: client.user.displayAvatarURL({ size: 64 }) })
            .setTitle(result.limit === 0 ? '🔓 Salon illimité' : `👥 Limite : ${result.limit} place(s)`)
            .setDescription(
                `Salon **${voiceChannel.name}**\n\n` +
                    'Tu peux ajuster en un clic avec les boutons ci-dessous.'
            )
            .setFooter({ text: 'Vocal temporaire — propriétaire uniquement' })
            .setTimestamp();

        await message.channel.send({
            embeds: [embed],
            components: [buildVoicelimitButtonRow(voiceChannel.id)],
        });
    } catch (err) {
        console.error(err);
        message.reply("❌ Impossible d’envoyer la confirmation.");
    }
};
