const { PermissionFlagsBits } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply("❌ Tu n'as pas la permission de configurer le bot.");

    const cfg = getGuildConfig(message.guild.id);

    if (!cfg.joinVoiceChannel)
        return message.reply("❌ Aucun salon hub configuré.");

    const existingHub = message.guild.channels.cache.get(cfg.joinVoiceChannel);
    if (existingHub) await existingHub.delete().catch(() => {});

    setGuildConfig(message.guild.id, 'joinVoiceChannel', null);
    message.reply("🗑️ Salon hub supprimé ! Tu peux en recréer un avec `+setjoinvoice`.");
};