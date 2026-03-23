const { PermissionFlagsBits } = require('discord.js');
const { setGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply("❌ Tu n'as pas la permission de configurer le bot.");

    const subcommand = args[0];

    if (subcommand === 'join') {
        const channel = message.mentions.channels.first()
            || (args[1] ? message.guild.channels.cache.get(args[1]) : null)
            || message.channel;
        setGuildConfig(message.guild.id, 'welcomeChannel', channel.id);
        message.reply(`✅ Les messages d'arrivée seront envoyés dans ${channel}.`);

    } else if (subcommand === 'leave') {
        const channel = message.mentions.channels.first()
            || (args[1] ? message.guild.channels.cache.get(args[1]) : null)
            || message.channel;
        setGuildConfig(message.guild.id, 'leaveChannel', channel.id);
        message.reply(`✅ Les messages de départ seront envoyés dans ${channel}.`);

    } else {
        message.reply([
            "⚠️ Utilisation :",
            "`+setwelcome join #salon` → salon des arrivées",
            "`+setwelcome leave #salon` → salon des départs",
        ].join("\n"));
    }
};