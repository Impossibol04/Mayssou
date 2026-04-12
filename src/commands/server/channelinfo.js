const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = async (client, message, args) => {
    const ch =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(String(args[0] || '').replace(/[<#>]/g, '')) ||
        message.channel;

    const typeLabel = Object.keys(ChannelType).find((k) => ChannelType[k] === ch.type) || String(ch.type);

    const embed = new EmbedBuilder()
        .setTitle(`#️⃣ ${ch.name}`)
        .setColor(0x3498db)
        .addFields(
            { name: 'ID', value: `\`${ch.id}\``, inline: true },
            { name: 'Type', value: typeLabel, inline: true },
            { name: 'Créé', value: `<t:${Math.floor(ch.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

    if (ch.topic) embed.addFields({ name: 'Sujet', value: String(ch.topic).slice(0, 900) });
    if (ch.isTextBased() && 'rateLimitPerUser' in ch && ch.rateLimitPerUser)
        embed.addFields({ name: 'Slowmode', value: `${ch.rateLimitPerUser}s`, inline: true });

    message.channel.send({ embeds: [embed] });
};
