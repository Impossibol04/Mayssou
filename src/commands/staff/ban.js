const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ Non autorisé.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `+ban @user/ID [raison]`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const target = await client.users.fetch(targetId).catch(() => null);

    if (!target) return message.reply("❌ Utilisateur introuvable.");
    if (target.id === message.author.id) return message.reply("❌ Tu ne peux pas te ban toi-même.");

    const member = await message.guild.members.fetch(targetId).catch(() => null);
    if (member && !member.bannable) return message.reply("❌ Je ne peux pas ban ce membre.");

    const reason = message.mentions.users.first()
        ? args.slice(1).join(" ") || "Aucune raison précisée."
        : args.slice(1).join(" ") || "Aucune raison précisée.";

    const banDMEmbed = new EmbedBuilder()
        .setTitle("🔨 Tu as été banni")
        .setDescription(`Tu as été banni du serveur **${message.guild.name}**.`)
        .setColor("Red")
        .addFields(
            { name: "📋 Raison", value: reason },
            { name: "🛡️ Modérateur", value: message.author.username }
        )
        .setThumbnail(message.guild.iconURL())
        .setTimestamp();

    const banLogEmbed = new EmbedBuilder()
        .setTitle("🔨 Membre Banni")
        .setColor("Red")
        .addFields(
            { name: "👤 Cible", value: `${target.username} (\`${target.id}\`)`, inline: true },
            { name: "👮 Modérateur", value: `${message.author.username}`, inline: true },
            { name: "📝 Raison", value: reason }
        )
        .setTimestamp();

    await target.send({ embeds: [banDMEmbed] }).catch(() => console.log(`DMs fermés pour ${target.username}.`));
    await message.guild.members.ban(targetId, { reason });
    message.channel.send({ embeds: [banLogEmbed] });
};