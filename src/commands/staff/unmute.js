const { PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modlogs');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply("❌ Tu n’as pas la permission **Modérer les membres**.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `unmute @membre/ID` — retire le timeout Discord.");

    const targetId = message.mentions.users.first()?.id || args[0];
    const member = await message.guild.members.fetch(targetId).catch(() => null);
    if (!member) return message.reply("❌ Membre introuvable sur ce serveur.");

    if (!member.communicationDisabledUntil || member.communicationDisabledUntil < new Date())
        return message.reply("ℹ️ Ce membre n’est pas en timeout (ou c’est déjà expiré).");

    try {
        await member.timeout(null, `Unmute par ${message.author.tag}`);
        message.react("✅").catch(() => {});
        await sendModLog(client, message.guild, {
            action: 'timeout',
            moderator: message.author,
            target: member.user,
            reason: 'Fin du timeout (unmute)',
        });
        message.channel.send(`🔊 **${member.user.username}** n’est plus en timeout.`);
    } catch (e) {
        if (e.code === 50013) {
            return message.reply("❌ Je ne peux pas modifier ce membre (rôle / hiérarchie).");
        }
        console.error(e);
        message.reply("❌ Erreur lors du unmute.");
    }
};
