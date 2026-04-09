const { PermissionFlagsBits } = require('discord.js');
const { sendModLog } = require('../../utils/modlogs');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply("❌ Non autorisé.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `+timeout @user/ID [minutes]`");

    const targetId = message.mentions.users.first()?.id || args[0];
    const duration = parseInt(message.mentions.users.first() ? args[1] : args[1]);

    if (isNaN(duration) || duration < 1)
        return message.reply("⚠️ Précise une durée en minutes. Ex: `+timeout @user 10`");

    const member = await message.guild.members.fetch(targetId).catch(() => null);
    if (!member) return message.reply("❌ Membre introuvable sur le serveur.");
    if (member.id === message.author.id) return message.reply("❌ Tu ne peux pas te timeout toi-même.");

    try {
        await member.timeout(duration * 60 * 1000);

        message.react("✅").catch(() => {});

        await sendModLog(client, message.guild, {
            action: 'timeout',
            moderator: message.author,
            target: member.user,
            extra: [{ name: '⏱️ Durée', value: `${duration} minute(s)` }],
        });

        message.channel.send(`🤐 **${member.user.username}** est en mode lecture seule pour **${duration} min**.`);
    } catch (error) {
        if (error.code === 50013) {
            message.reply("❌ Je n'ai pas les permissions pour timeout ce membre. Vérifie que mon rôle est au-dessus du sien.");
        } else {
            message.reply("❌ Une erreur est survenue.");
            console.error("Erreur timeout:", error);
        }
    }
};