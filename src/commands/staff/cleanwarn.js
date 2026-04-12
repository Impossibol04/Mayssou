const { PermissionFlagsBits } = require('discord.js');
const { getWarns, clearWarnsForUser, clearAllWarnsInGuild } = require('../../utils/warnStore');
const { sendModLog } = require('../../utils/modlogs');

module.exports = async (client, message, args) => {
    const isOwner = message.author.id === message.guild.ownerId;
    if (!isOwner && !message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply("❌ Tu n'as pas les permissions nécessaires.");

    if (!args[0]) {
        return message.reply(
            "⚠️ Utilisation : `cleanwarn @membre/ID` — supprime les warns enregistrés.\n" +
                "`cleanwarn all` — réinitialise **tous** les warns du serveur (owner ou **Gérer le serveur**)."
        );
    }

    if (args[0].toLowerCase() === 'all') {
        if (!isOwner && !message.member.permissions.has(PermissionFlagsBits.ManageGuild))
            return message.reply("❌ Seuls le propriétaire ou un membre avec **Gérer le serveur** peut tout effacer.");
        const n = clearAllWarnsInGuild(message.guild.id);
        await sendModLog(client, message.guild, {
            action: 'clear',
            moderator: message.author,
            target: null,
            reason: `Réinitialisation des warns (${n} entrée(s)).`,
        });
        return message.reply(`✅ **${n}** avertissement(s) supprimé(s) sur ce serveur.`);
    }

    const targetId = message.mentions.users.first()?.id || args[0];
    const targetUser = message.mentions.users.first() || (await client.users.fetch(targetId).catch(() => null));
    if (!targetUser) return message.reply("❌ Utilisateur introuvable.");

    const before = getWarns(message.guild.id, targetId).length;
    if (before === 0) return message.reply("ℹ️ Ce membre n’a aucun warn enregistré par le bot.");

    clearWarnsForUser(message.guild.id, targetId);

    await sendModLog(client, message.guild, {
        action: 'clear',
        moderator: message.author,
        target: targetUser,
        reason: `Suppression de **${before}** warn(s) enregistré(s).`,
    });

    message.reply(`✅ **${before}** warn(s) effacé(s) pour **${targetUser.username}**.`);
};
