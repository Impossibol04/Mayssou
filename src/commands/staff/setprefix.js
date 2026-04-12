const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getGuildConfig, setGuildConfig, deleteGuildConfigKey } = require('../../utils/guildConfig');

function icon(client) {
    return client.user.displayAvatarURL({ extension: 'png', size: 128 });
}

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Refusé')
            .setDescription('Réservé aux **administrateurs**.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const p = (args[0] || '').trim();
    const def = (process.env.prefix || '+').trim() || '+';

    if (!p) {
        const cur = getGuildConfig(message.guild.id).prefix || def;
        const e = new EmbedBuilder()
            .setColor(0x5865f2)
            .setAuthor({ name: 'Préfixe du serveur', iconURL: icon(client) })
            .setTitle('⚙️ Configuration')
            .addFields(
                { name: 'Actif sur ce serveur', value: `\`${cur}\``, inline: true },
                { name: 'Défaut (env)', value: `\`${def}\``, inline: true },
                {
                    name: 'Modifier',
                    value: `\`setprefix !\` — 1 à 8 caractères\n\`setprefix reset\` — revenir au défaut`,
                    inline: false,
                }
            )
            .setFooter({ text: 'Les commandes slash / ne changent pas' })
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    if (p.toLowerCase() === 'reset' || p.toLowerCase() === 'default') {
        deleteGuildConfigKey(message.guild.id, 'prefix');
        const e = new EmbedBuilder()
            .setColor(0x57f287)
            .setAuthor({ name: 'Préfixe', iconURL: icon(client) })
            .setTitle('✅ Réinitialisé')
            .setDescription(`Retour au préfixe par défaut : \`${def}\``)
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    if (p.length > 8 || p.length < 1) {
        const e = new EmbedBuilder()
            .setColor(0xf39c12)
            .setTitle('⚠️ Longueur')
            .setDescription('Le préfixe doit faire entre **1** et **8** caractères.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }
    if (/\s/.test(p)) {
        const e = new EmbedBuilder()
            .setColor(0xf39c12)
            .setTitle('⚠️ Format')
            .setDescription('Pas d’**espaces** dans le préfixe.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    setGuildConfig(message.guild.id, 'prefix', p);
    const e = new EmbedBuilder()
        .setColor(0x57f287)
        .setAuthor({ name: 'Préfixe', iconURL: icon(client) })
        .setTitle('✅ Enregistré')
        .setDescription(`Nouveau préfixe : **${p}**\nExemple : \`${p}help\``)
        .setTimestamp();
    message.reply({ embeds: [e] });
};
