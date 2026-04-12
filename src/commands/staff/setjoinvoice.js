const { ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../../utils/guildConfig');

function icon(client) {
    return client.user.displayAvatarURL({ extension: 'png', size: 128 });
}

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Permission')
            .setDescription('Il te faut **Gérer le serveur**.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const cfg = getGuildConfig(message.guild.id);

    if (cfg.joinVoiceChannel) {
        const existingHub = message.guild.channels.cache.get(cfg.joinVoiceChannel);
        if (existingHub) {
            const e = new EmbedBuilder()
                .setColor(0xf39c12)
                .setAuthor({ name: 'Hub vocal', iconURL: icon(client) })
                .setTitle('⚠️ Hub déjà configuré')
                .setDescription(
                    `Un salon existe déjà : **${existingHub}**\n` +
                        'Supprime-le d’abord avec `deletejoinvoice` si tu veux en recréer un.'
                )
                .setTimestamp();
            return message.reply({ embeds: [e] });
        }
    }

    let category = message.mentions.channels.first() || null;
    if (!category && args[0]) {
        category =
            message.guild.channels.cache.get(args[0]) ||
            (await message.guild.channels.fetch(args[0]).catch(() => null));
    }

    try {
        const hubChannel = await message.guild.channels.create({
            name: '➕ Créer un vocal',
            type: ChannelType.GuildVoice,
            parent: category?.type === ChannelType.GuildCategory ? category : null,
        });

        setGuildConfig(message.guild.id, 'joinVoiceChannel', hubChannel.id);

        const e = new EmbedBuilder()
            .setColor(0x57f287)
            .setAuthor({ name: 'Vocaux temporaires', iconURL: icon(client) })
            .setTitle('✅ Hub créé')
            .setDescription(
                `Salon : **${hubChannel.name}**\n\n` +
                    'Quand un membre rejoint ce hub, le bot crée un **vocal privé** et envoie un **panneau de contrôle** au propriétaire.'
            )
            .setTimestamp();
        message.reply({ embeds: [e] });
    } catch (err) {
        console.error('Erreur création hub:', err);
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Erreur')
            .setDescription('Impossible de créer le salon hub.')
            .setTimestamp();
        message.reply({ embeds: [e] });
    }
};
