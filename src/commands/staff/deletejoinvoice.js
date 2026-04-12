const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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

    if (!cfg.joinVoiceChannel) {
        const e = new EmbedBuilder()
            .setColor(0x95a5a6)
            .setTitle('ℹ️ Rien à supprimer')
            .setDescription('Aucun salon hub n’est configuré.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const existingHub = message.guild.channels.cache.get(cfg.joinVoiceChannel);
    if (existingHub) await existingHub.delete().catch(() => {});

    setGuildConfig(message.guild.id, 'joinVoiceChannel', null);

    const e = new EmbedBuilder()
        .setColor(0x5865f2)
        .setAuthor({ name: 'Hub vocal', iconURL: icon(client) })
        .setTitle('🗑️ Supprimé')
        .setDescription('Le salon hub a été retiré. Tu peux en recréer un avec `setjoinvoice`.')
        .setTimestamp();
    message.reply({ embeds: [e] });
};
