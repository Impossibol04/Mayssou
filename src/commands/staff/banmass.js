const {
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require('discord.js');

const COLOR_WARN = 0xf39c12;
const COLOR_DANGER = 0xe74c3c;
const COLOR_OK = 0x57f287;
const COLOR_MUTED = 0x95a5a6;
const COLOR_PARTIAL = 0xe67e22;

function botThumb(client) {
    return client.user?.displayAvatarURL({ extension: 'png', size: 128 });
}

function banmassButtonRow(triggerMessageId, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`mayssou:bm:yes:${triggerMessageId}`)
            .setLabel('Confirmer le ban massif')
            .setEmoji('🔨')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled),
        new ButtonBuilder()
            .setCustomId(`mayssou:bm:no:${triggerMessageId}`)
            .setLabel('Annuler')
            .setEmoji('✖️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabled)
    );
}

function progressBar(done, total) {
    const w = 12;
    const filled = total <= 0 ? 0 : Math.round((done / total) * w);
    const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, w - filled));
    const pct = total <= 0 ? 0 : Math.round((done / total) * 100);
    return `\`${bar}\` **${pct}%** (${done}/${total})`;
}

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ Tu n'as pas la permission de bannir des membres.");

    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ **Le bot** n'a pas la permission de bannir des membres.");

    if (!args[0])
        return message.reply("⚠️ Utilisation : `banmass @user1 @user2 ID3 [raison ici]`");

    const mentionIds = [...(message.mentions?.users?.values() ?? [])].map((u) => u.id);
    const rawIds = args.filter((a) => /^\d{17,20}$/.test(a));
    const targetIds = [...new Set([...mentionIds, ...rawIds])];

    if (targetIds.length === 0) return message.reply("❌ Aucun utilisateur ou ID valide trouvé.");

    if (targetIds.length > 25) return message.reply("❌ Sécurité : max **25** personnes en une seule commande.");

    const reason =
        args.filter((a) => !/<@!?(\d{17,20})>/.test(a) && !/^\d{17,20}$/.test(a)).join(' ') || 'Mass Ban';

    const protectedIds = [message.author.id, client.user.id];

    const preview =
        targetIds
            .slice(0, 10)
            .map((id) => `<@${id}>`)
            .join(' ') + (targetIds.length > 10 ? ` … (+${targetIds.length - 10})` : '');

    const triggerId = message.id;
    const confirmEmbed = new EmbedBuilder()
        .setColor(COLOR_WARN)
        .setAuthor({ name: 'Ban massif — confirmation', iconURL: botThumb(client) })
        .setTitle('⚠️ Action irréversible')
        .setDescription(
            `**${targetIds.length}** compte(s) seront bannis de **${message.guild.name}**.`
        )
        .addFields(
            { name: 'Cibles', value: preview.slice(0, 1024), inline: false },
            { name: 'Raison', value: reason.slice(0, 1024), inline: false },
            {
                name: 'Sécurité',
                value: '• Max 25 par commande\n• Toi et le bot ne seront pas bannis\n• Délai **40 s** pour confirmer',
                inline: false,
            }
        )
        .setFooter({ text: `Demandé par ${message.author.tag}` })
        .setTimestamp();

    const confirmMessage = await message.reply({
        embeds: [confirmEmbed],
        components: [banmassButtonRow(triggerId)],
    });

    const collector = confirmMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 40_000,
        filter: (i) =>
            i.user.id === message.author.id &&
            (i.customId === `mayssou:bm:yes:${triggerId}` || i.customId === `mayssou:bm:no:${triggerId}`),
    });

    collector.on('collect', async (interaction) => {
        if (interaction.customId === `mayssou:bm:no:${triggerId}`) {
            const cancelled = new EmbedBuilder()
                .setColor(COLOR_MUTED)
                .setAuthor({ name: 'Ban massif', iconURL: botThumb(client) })
                .setTitle('✖️ Annulé')
                .setDescription('Aucun bannissement n’a été effectué.')
                .setTimestamp();
            await interaction.update({ embeds: [cancelled], components: [banmassButtonRow(triggerId, true)] });
            return;
        }

        const running = new EmbedBuilder()
            .setColor(COLOR_DANGER)
            .setAuthor({ name: 'Ban massif en cours…', iconURL: botThumb(client) })
            .setTitle('🔨 Exécution')
            .setDescription(progressBar(0, targetIds.length))
            .setTimestamp();
        await interaction.update({ embeds: [running], components: [banmassButtonRow(triggerId, true)] });

        const success = [];
        const failed = [];
        let processed = 0;

        const progressEmbed = (done) =>
            new EmbedBuilder()
                .setColor(COLOR_DANGER)
                .setAuthor({ name: 'Ban massif en cours…', iconURL: botThumb(client) })
                .setTitle('🔨 Bannissements')
                .setDescription(progressBar(done, targetIds.length))
                .setFooter({ text: 'Merci de patienter — rate limit Discord' })
                .setTimestamp();

        const progressMsg = await message.channel.send({ embeds: [progressEmbed(0)] });

        for (const id of targetIds) {
            processed++;

            try {
                if (protectedIds.includes(id)) {
                    failed.push(`<@${id}> (protégé)`);
                    await new Promise((r) => setTimeout(r, 400));
                    continue;
                }

                const user = await client.users.fetch(id).catch(() => null);
                if (!user) {
                    failed.push(`\`${id}\` (inexistant)`);
                    continue;
                }

                const member = await message.guild.members.fetch(id).catch(() => null);
                if (member && !member.bannable) {
                    failed.push(`${user.username} (trop haut gradé)`);
                    continue;
                }

                await message.guild.members.ban(id, { reason: `${reason} | Par ${message.author.tag}` });
                success.push(`${user.username} (\`${id}\`)`);
            } catch {
                failed.push(`\`${id}\` (erreur)`);
            }

            if (processed % 5 === 0 || processed === targetIds.length) {
                await progressMsg.edit({ embeds: [progressEmbed(processed)] }).catch(() => {});
            }

            await new Promise((r) => setTimeout(r, 950));
        }

        const allOk = failed.length === 0;
        const resultColor = allOk ? COLOR_OK : success.length === 0 ? COLOR_DANGER : COLOR_PARTIAL;

        const resultEmbed = new EmbedBuilder()
            .setTitle('🔨 Ban massif terminé')
            .setColor(resultColor)
            .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ size: 64 }) || undefined })
            .addFields(
                { name: '👮 Modérateur', value: `${message.author}`, inline: true },
                { name: '📊 Total tenté', value: `${targetIds.length}`, inline: true },
                { name: '✅ Succès', value: `${success.length}`, inline: true },
                {
                    name: `Détail succès (${success.length})`,
                    value: success.length > 0 ? success.join(', ').slice(0, 1024) : 'Aucun',
                }
            );

        if (failed.length > 0)
            resultEmbed.addFields({
                name: `Échecs (${failed.length})`,
                value: failed.join(', ').slice(0, 1024),
            });

        resultEmbed.setTimestamp();
        await progressMsg.edit({ content: null, embeds: [resultEmbed] });
    });

    collector.on('end', (collected) => {
        if (collected.size === 0 && confirmMessage.editable) {
            const expired = new EmbedBuilder()
                .setColor(COLOR_MUTED)
                .setAuthor({ name: 'Ban massif', iconURL: botThumb(client) })
                .setTitle('⏰ Délai expiré')
                .setDescription('Confirmation non reçue — **aucun** bannissement.')
                .setTimestamp();
            confirmMessage
                .edit({ embeds: [expired], components: [banmassButtonRow(triggerId, true)] })
                .catch(() => {});
        }
    });
};
