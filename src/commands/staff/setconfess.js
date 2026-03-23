const { PermissionFlagsBits } = require('discord.js');
const { setGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply("❌ Tu n'as pas la permission de configurer le bot.");

    const channel = message.mentions.channels.first()
        || (args[0] ? message.guild.channels.cache.get(args[0]) : null)
        || message.channel;

    if (!channel) return message.reply("❌ Salon introuvable.");

    setGuildConfig(message.guild.id, 'confessChannel', channel.id);
    setGuildConfig(message.guild.id, 'confessInputChannel', channel.id);

    message.reply(`✅ Salon de confession défini sur ${channel}.\n📌 Les membres pourront uniquement utiliser \`+confess\` dans ce salon.\n🤫 Les confessions seront publiées dans ce même salon.`);
};