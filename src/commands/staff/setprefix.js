const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setGuildConfig, deleteGuildConfigKey } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
        return message.reply('❌ Réservé aux **administrateurs**.');

    const p = (args[0] || '').trim();
    if (!p) {
        const cur = getGuildConfig(message.guild.id).prefix;
        const def = (process.env.prefix || '+').trim() || '+';
        return message.reply(
            `Préfixe actuel sur ce serveur : **${cur || def}** (défaut env : **${def}**).\n` +
                'Utilisation : `setprefix !` — max **8** caractères, ou `setprefix reset`.'
        );
    }

    if (p.toLowerCase() === 'reset' || p.toLowerCase() === 'default') {
        deleteGuildConfigKey(message.guild.id, 'prefix');
        return message.reply('✅ Préfixe personnalisé supprimé — retour au préfixe par défaut.');
    }

    if (p.length > 8 || p.length < 1) return message.reply('⚠️ Le préfixe doit faire entre **1** et **8** caractères.');
    if (/\s/.test(p)) return message.reply('⚠️ Pas d’espaces dans le préfixe.');

    setGuildConfig(message.guild.id, 'prefix', p);
    message.reply(`✅ Préfixe du serveur : **${p}**\nExemple : \`${p}help\``);
};
