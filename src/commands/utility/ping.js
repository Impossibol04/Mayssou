const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const msg = await message.reply({ embeds: [new EmbedBuilder().setColor(0x5865f2).setDescription('🏓 Mesure…')] });

    const ping = msg.createdTimestamp - message.createdTimestamp;
    const apiPing = client.ws.ping;

    const embed = new EmbedBuilder()
        .setAuthor({ name: 'Latence', iconURL: client.user.displayAvatarURL({ size: 64 }) })
        .setTitle('🏓 Pong')
        .setColor(0x5865f2)
        .addFields(
            { name: 'Aller-retour', value: `\`${ping} ms\``, inline: true },
            { name: 'Gateway', value: apiPing < 0 ? '`—`' : `\`${apiPing} ms\``, inline: true }
        )
        .setFooter({ text: message.author.tag })
        .setTimestamp();

    await msg.edit({ embeds: [embed] });
};
