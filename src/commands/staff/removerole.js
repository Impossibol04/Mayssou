const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles))
        return message.reply("❌ Non autorisé.");

    if (args.length < 2)
        return message.reply("⚠️ Utilisation : `+removerole @user/ID @role1 @role2 ...`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const member = await message.guild.members.fetch(targetId).catch(() => null);
    if (!member) return message.reply("❌ Membre introuvable.");

    const isOwner = message.author.id === message.guild.ownerId;

    const mentionedRoles = [...message.mentions.roles.values()];
    const roleIds = args.slice(message.mentions.users.size > 0 ? 1 : 1);

    const roles = mentionedRoles.length > 0
        ? mentionedRoles
        : roleIds.map(id => message.guild.roles.cache.get(id)).filter(Boolean);

    if (roles.length === 0)
        return message.reply("❌ Aucun rôle valide trouvé.");

    const results = [];

    for (const role of roles) {
        if (!isOwner && role.position >= message.member.roles.highest.position) {
            results.push(`❌ ${role} — rôle supérieur ou égal au tien`);
            continue;
        }
        if (!member.roles.cache.has(role.id)) {
            results.push(`⚠️ ${role} — non possédé`);
            continue;
        }
        try {
            await member.roles.remove(role);
            results.push(`✅ ${role} — retiré`);
        } catch {
            results.push(`❌ ${role} — erreur lors du retrait`);
        }
    }

    message.reply(`**${member.user.username}** :\n${results.join('\n')}`);
};