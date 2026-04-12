const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../../utils/guildConfig');

function anonId(userId) {
    const n = [...userId].reduce((a, c) => a + c.charCodeAt(0), 0) % 9000;
    return `Anon #${1000 + n}`;
}

module.exports = async (client, message, args) => {
    const config = getGuildConfig(message.guild.id);

    const inputId = config.confessInputChannel || config.confessChannel;
    if (inputId && message.channel.id !== inputId) {
        await message.delete().catch(() => {});
        const hint = message.guild.channels.cache.get(inputId);
        const warn = await message.channel.send(
            `❌ ${message.author}, utilise le salon ${hint || 'configuré'} pour \`+confess\`.`
        );
        setTimeout(() => warn.delete().catch(() => {}), 5000);
        return;
    }

    const confession = args.join(' ');
    if (!confession) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send(`❌ ${message.author}, écris ton message après \`+confess\`.`);
        setTimeout(() => warn.delete().catch(() => {}), 5000);
        return;
    }

    if (!config.confessChannel) {
        await message.delete().catch(() => {});
        return message.channel
            .send('❌ Aucun salon configuré. Un admin doit faire `+setconfess #salon`.')
            .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const targetChannel = message.guild.channels.cache.get(config.confessChannel);
    if (!targetChannel?.isTextBased()) {
        await message.delete().catch(() => {});
        return message.channel
            .send('❌ Salon de publication introuvable. Reconfigure avec `+setconfess output #salon`.')
            .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    await message.delete().catch(() => {});

    const stamp = anonId(message.author.id);
    const publicEmbed = new EmbedBuilder()
        .setTitle('🤫 Confession')
        .setDescription(`*"${confession.slice(0, 3500)}"*`)
        .setColor('#2f3136')
        .setFooter({ text: `${stamp} · +confess pour participer` })
        .setTimestamp();

    await targetChannel.send({ embeds: [publicEmbed] });

    const preview = confession.length > 300 ? `${confession.slice(0, 300)}…` : confession;
    await message.author
        .send({
            content: `✅ Publié anonymement dans **${targetChannel.name}**.\n\n_Aperçu :_ ${preview}`,
        })
        .catch(() => {});
};
