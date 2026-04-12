const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modlogs');
const { addWarn } = require('../../utils/warnStore');

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

    const reason = args.slice(message.mentions.users.first() ? 1 : 1).join(" ") || "Aucune raison précisée.";

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

    await target.send({ embeds: [warnDMEmbed] }).catch(() => {});

    addWarn(message.guild.id, target.id, {
        reason,
        moderatorId: message.author.id,
        at: new Date().toISOString(),
    });

    message.react("✅").catch(() => {});

    await sendModLog(client, message.guild, {
        action: 'warn',
        moderator: message.author,
        target: target.user,
        reason,
    });
};