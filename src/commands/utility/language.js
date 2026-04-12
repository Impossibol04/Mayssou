const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply('❌ Il faut **Gérer le serveur**.');

    const v = (args[0] || '').toLowerCase();
    if (!v) {
        const cur = (getGuildConfig(message.guild.id).locale || 'fr').toLowerCase();
        return message.reply(
            `Langue du serveur (pour défauts du bot, ex. **translate**) : **${cur}**.\n` +
                'Utilisation : `language fr` ou `language en`.'
        );
    }

    if (!['fr', 'en'].includes(v)) return message.reply('⚠️ Langues supportées : **fr**, **en**.');

    setGuildConfig(message.guild.id, 'locale', v);
    message.reply(`✅ Langue du serveur : **${v}**.`);
};
