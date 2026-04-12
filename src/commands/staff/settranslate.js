const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply('❌ Il faut **Gérer le serveur**.');

    const v = (args[0] || '').toLowerCase();
    if (!v) {
        const off = getGuildConfig(message.guild.id).disableTranslate === true;
        return message.reply(
            `Traduction \`translate\` : **${off ? 'désactivée' : 'activée'}** sur ce serveur.\n` +
                'Utilisation : `settranslate on` | `settranslate off`.'
        );
    }

    if (['on', 'oui', '1', 'true'].includes(v)) {
        setGuildConfig(message.guild.id, 'disableTranslate', false);
        return message.reply('✅ **translate** réactivé.');
    }
    if (['off', 'non', '0', 'false'].includes(v)) {
        setGuildConfig(message.guild.id, 'disableTranslate', true);
        return message.reply('✅ **translate** désactivé (texte ne part plus vers les services tiers).');
    }

    message.reply('⚠️ `settranslate on` ou `settranslate off`.');
};
