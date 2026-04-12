const { EmbedBuilder } = require('discord.js');

module.exports = async (client, message, args) => {
    const role =
        message.mentions.roles.first() ||
        (args[0] && message.guild.roles.cache.get(String(args[0]).replace(/[<@&>]/g, ''))) ||
        message.member.roles.highest;

    if (!role) return message.reply('⚠️ `roleinfo [@rôle|ID]`');

    const embed = new EmbedBuilder()
        .setTitle(`🎭 ${role.name}`)
        .setColor(role.color || 0x99aab5)
        .addFields(
            { name: 'ID', value: `\`${role.id}\``, inline: true },
            { name: 'Membres', value: `${role.members?.size ?? '—'}`, inline: true },
            { name: 'Couleur', value: role.hexColor || '—', inline: true },
            { name: 'Création', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true },
            { name: 'Affichage séparé', value: role.hoist ? 'Oui' : 'Non', inline: true },
            {
                name: 'Permissions (extrait)',
                value:
                    role.permissions
                        .toArray()
                        .slice(0, 12)
                        .join(', ')
                        .slice(0, 900) || 'Aucune notable',
            }
        )
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};
