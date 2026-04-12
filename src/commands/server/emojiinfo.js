const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const raw = args[0] || message.content.match(/<a?:\w+:(\d+)>/)?.[0];
    if (!raw) return message.reply('⚠️ `emojiinfo <:emoji:>` ou `emojiinfo nom`');

    const idMatch = raw.match(/(\d{17,20})/);
    let emoji = idMatch ? message.guild.emojis.cache.get(idMatch[1]) : message.guild.emojis.cache.find((e) => e.name === raw);

    if (!emoji) return message.reply('❌ Emoji introuvable sur ce serveur.');

    const embed = new EmbedBuilder()
        .setTitle(`${emoji.name}`)
        .setThumbnail(emoji.url)
        .setColor(0xf1c40f)
        .addFields(
            { name: 'ID', value: `\`${emoji.id}\``, inline: true },
            { name: 'Animé', value: emoji.animated ? 'Oui' : 'Non', inline: true },
            { name: 'URL', value: emoji.url, inline: false }
        )
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};
