const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    const config = getGuildConfig(message.guild.id);

    // Vérifie si on est dans le bon salon
    if (config.confessInputChannel && message.channel.id !== config.confessInputChannel) {
        await message.delete().catch(() => {});
        const confessChannel = message.guild.channels.cache.get(config.confessInputChannel);
        const warn = await message.channel.send(
            `❌ ${message.author}, les confessions ne sont pas autorisées ici. Utilise ${confessChannel} !`
        );
        setTimeout(() => warn.delete().catch(() => {}), 5000);
        return;
    }

    const confession = args.join(" ");
    if (!confession) {
        await message.delete().catch(() => {});
        const warn = await message.channel.send(`❌ ${message.author}, tu dois écrire un message après \`+confess\`.`);
        setTimeout(() => warn.delete().catch(() => {}), 5000);
        return;
    }

    if (!config.confessChannel) {
        await message.delete().catch(() => {});
        return message.channel.send("❌ Aucun salon configuré. Un admin doit faire `+setconfess #salon`.")
            .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const targetChannel = message.guild.channels.cache.get(config.confessChannel);
    if (!targetChannel) {
        await message.delete().catch(() => {});
        return message.channel.send("❌ Le salon configuré est introuvable. Reconfigure avec `+setconfess #salon`.")
            .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    await message.delete().catch(() => {});

    const publicEmbed = new EmbedBuilder()
        .setTitle("🤫 Nouvelle Confession")
        .setDescription(`*"${confession}"*`)
        .setColor("#2f3136")
        .setFooter({ text: "Utilise +confess pour t'exprimer anonymement" })
        .setTimestamp();

    await targetChannel.send({ embeds: [publicEmbed] });
    await message.author.send("✅ Ta confession a été publiée anonymement !").catch(() => {});
};