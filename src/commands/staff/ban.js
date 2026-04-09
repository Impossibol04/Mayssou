const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modLog');

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

    const reason = args.slice(message.mentions.users.first() ? 1 : 1).join(" ") || "Aucune raison précisée.";

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

    await target.send({ embeds: [banDMEmbed] }).catch(() => {});
    await message.guild.members.ban(targetId, { reason });

    message.react("✅").catch(() => {});

    await sendModLog(client, message.guild, {
        action: 'ban',
        moderator: message.author,
        target,
        reason,
    });
};