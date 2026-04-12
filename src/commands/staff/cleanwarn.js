const {
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require('discord.js');
const { getWarns, clearWarnsForUser, clearAllWarnsInGuild, getGuildWarnSummary } = require('../../utils/warnStore');
const { sendModLog } = require('../../utils/modlogs');

function thumb(client) {
    return client.user?.displayAvatarURL({ extension: 'png', size: 128 });
}

function allWarnRows(triggerId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`mayssou:cw:yes:${triggerId}`)
            .setLabel('Tout effacer')
            .setEmoji('⚠️')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`mayssou:cw:no:${triggerId}`)
            .setLabel('Annuler')
            .setEmoji('✖️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );
}

module.exports = async (client, message, args) => {
    const isOwner = message.author.id === message.guild.ownerId;
    if (!isOwner && !message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply("❌ Tu n'as pas les permissions nécessaires.");

    if (!args[0]) {
        const embed = new EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle('🧹 cleanwarn')
            .setDescription(
                '**Membre** — `cleanwarn @membre` ou `cleanwarn <ID>`\n' +
                    '**Tout le serveur** — `cleanwarn all` (confirmation + owner / Gérer le serveur)'
            )
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    if (args[0].toLowerCase() === 'all') {
        if (!isOwner && !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return message.reply('❌ Seuls le propriétaire ou un membre avec **Gérer le serveur** peut tout effacer.');
        }

        const summary = getGuildWarnSummary(message.guild.id);
        const userCount = summary.length;
        const totalEntries = summary.reduce((a, s) => a + s.count, 0);

        if (totalEntries === 0) {
            const empty = new EmbedBuilder()
                .setColor(0x95a5a6)
                .setTitle('ℹ️ Aucun warn')
                .setDescription('Il n’y a rien à effacer sur ce serveur.')
                .setTimestamp();
            return message.reply({ embeds: [empty] });
        }

        const triggerId = message.id;
        const confirm = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setAuthor({ name: 'Réinitialisation des warns', iconURL: thumb(client) })
            .setTitle('⚠️ Confirmer la suppression globale')
            .setDescription(
                `Tous les warns enregistrés par le bot sur **${message.guild.name}** seront **définitivement** supprimés.`
            )
            .addFields(
                { name: 'Membres concernés', value: `${userCount}`, inline: true },
                { name: 'Entrées totales', value: `${totalEntries}`, inline: true }
            )
            .setFooter({ text: '40 secondes pour confirmer' })
            .setTimestamp();

        const confirmMsg = await message.reply({ embeds: [confirm], components: [allWarnRows(triggerId)] });

        const collector = confirmMsg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 40_000,
            filter: (i) =>
                i.user.id === message.author.id &&
                (i.customId === `mayssou:cw:yes:${triggerId}` || i.customId === `mayssou:cw:no:${triggerId}`),
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === `mayssou:cw:no:${triggerId}`) {
                const cancelEmb = new EmbedBuilder()
                    .setColor(0x95a5a6)
                    .setTitle('✖️ Annulé')
                    .setDescription('Les warns n’ont pas été modifiés.')
                    .setTimestamp();
                await interaction.update({ embeds: [cancelEmb], components: [allWarnRows(triggerId, true)] });
                return;
            }

            const n = clearAllWarnsInGuild(message.guild.id);
            await sendModLog(client, message.guild, {
                action: 'clear',
                moderator: message.author,
                target: null,
                reason: `Réinitialisation des warns (${n} entrée(s)).`,
            });

            const done = new EmbedBuilder()
                .setColor(0x57f287)
                .setAuthor({ name: 'Warns réinitialisés', iconURL: thumb(client) })
                .setTitle('✅ Terminé')
                .setDescription(`**${n}** avertissement(s) supprimé(s) sur ce serveur.`)
                .setTimestamp();
            await interaction.update({ embeds: [done], components: [allWarnRows(triggerId, true)] });
        });

        collector.on('end', (collected) => {
            if (collected.size === 0 && confirmMsg.editable) {
                const expired = new EmbedBuilder()
                    .setColor(0x95a5a6)
                    .setTitle('⏰ Délai expiré')
                    .setDescription('Aucune modification.')
                    .setTimestamp();
                confirmMsg.edit({ embeds: [expired], components: [allWarnRows(triggerId, true)] }).catch(() => {});
            }
        });

        return;
    }

    const targetId = message.mentions.users.first()?.id || args[0];
    const targetUser = message.mentions.users.first() || (await client.users.fetch(targetId).catch(() => null));
    if (!targetUser) return message.reply('❌ Utilisateur introuvable.');

    const before = getWarns(message.guild.id, targetId).length;
    if (before === 0) return message.reply('ℹ️ Ce membre n’a aucun warn enregistré par le bot.');

    clearWarnsForUser(message.guild.id, targetId);

    await sendModLog(client, message.guild, {
        action: 'clear',
        moderator: message.author,
        target: targetUser,
        reason: `Suppression de **${before}** warn(s) enregistré(s).`,
    });

    const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setAuthor({ name: 'Warns effacés', iconURL: thumb(client) })
        .setTitle('✅ OK')
        .setDescription(`**${before}** warn(s) effacé(s) pour **${targetUser.username}**.`)
        .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
        .setTimestamp();

    message.reply({ embeds: [embed] });
};
