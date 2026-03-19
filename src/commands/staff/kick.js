const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
        return message.reply("❌ Non autorisé.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `+kick @user/ID [raison]`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const member = await message.guild.members.fetch(targetId).catch(() => null);

    if (!member) return message.reply("❌ Membre introuvable sur le serveur.");
    if (member.id === message.author.id) return message.reply("❌ Tu ne peux pas te kick toi-même.");
    if (!member.kickable) return message.reply("❌ Je ne peux pas kick ce membre.");

    const reason = message.mentions.users.first()
        ? args.slice(1).join(" ") || "Aucune raison précisée."
        : args.slice(1).join(" ") || "Aucune raison précisée.";

    // Embed MP
    const kickDMEmbed = new EmbedBuilder()
        .setTitle("👢 Tu as été kick")
        .setDescription(`Tu as été kick du serveur **${message.guild.name}**.`)
        .setColor("Orange")
        .addFields(
            { name: "📋 Raison", value: reason },
            { name: "🛡️ Modérateur", value: message.author.username }
        )
        .setThumbnail(message.guild.iconURL())
        .setTimestamp();

    // Embed log salon
    const kickLogEmbed = new EmbedBuilder()
        .setTitle("👢 Membre Kick")
        .setColor("Orange")
        .addFields(
            { name: "👤 Cible", value: `${member.user.username} (\`${member.id}\`)`, inline: true },
            { name: "👮 Modérateur", value: `${message.author.username}`, inline: true },
            { name: "📝 Raison", value: reason }
        )
        .setTimestamp();

    await member.send({ embeds: [kickDMEmbed] }).catch(() => console.log(`DMs fermés pour ${member.user.username}.`));
    await member.kick(reason);
    message.channel.send({ embeds: [kickLogEmbed] });
};