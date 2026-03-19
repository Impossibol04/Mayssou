const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    const isOwner = message.author.id === message.guild.ownerId;
    if (!isOwner && !message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply("❌ Tu n'as pas les permissions nécessaires.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `+warn @user/ID [raison]`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const target = await message.guild.members.fetch(targetId).catch(() => null);

    if (!target) return message.reply("❌ Impossible de trouver ce membre sur le serveur.");
    if (target.id === message.author.id) return message.reply("❌ Tu ne peux pas t'avertir toi-même.");
    if (target.user.bot) return message.reply("❌ Inutile d'avertir un bot.");
    if (!isOwner && target.roles.highest.position >= message.member.roles.highest.position)
        return message.reply("❌ Tu ne peux pas avertir ce membre (hiérarchie supérieure).");

    const reason = message.mentions.users.first()
        ? args.slice(1).join(" ") || "Aucune raison précisée."
        : args.slice(1).join(" ") || "Aucune raison précisée.";

    const warnDMEmbed = new EmbedBuilder()
        .setTitle("⚠️ Avertissement reçu")
        .setDescription(`Tu as reçu un avertissement sur le serveur **${message.guild.name}**.`)
        .setColor("#f1c40f")
        .addFields(
            { name: "📋 Raison", value: reason },
            { name: "🛡️ Modérateur", value: message.author.username }
        )
        .setThumbnail(message.guild.iconURL())
        .setTimestamp();

    const warnLogEmbed = new EmbedBuilder()
        .setTitle("📑 Log : Avertissement")
        .setColor("#f1c40f")
        .addFields(
            { name: "👤 Cible", value: `${target.user.username} (\`${target.id}\`)`, inline: true },
            { name: "👮 Modérateur", value: `${message.author.username}`, inline: true },
            { name: "📝 Raison", value: reason }
        )
        .setTimestamp();

    await target.send({ embeds: [warnDMEmbed] }).catch(() => console.log(`DMs fermés pour ${target.user.username}.`));
    message.channel.send({ embeds: [warnLogEmbed] });
};