const {
    EmbedBuilder,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
} = require('discord.js');

const { sendModLog } = require('../../utils/modlogs');

module.exports = async (client, message, args) => {
    // ── Permissions ────────────────────────────────────────────────────────────
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ Tu n'as pas la permission de bannir des membres.");

    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ **Le bot** n'a pas la permission de bannir des membres.");

    if (!args[0])
        return message.reply("⚠️ Utilisation : `+banlist @user1 @user2 ID3 [raison ici]`");

    // ── Cibles : mentions + IDs bruts (sans doublons) ─────────────────────────
    const mentionIds = [...(message.mentions?.users?.values() ?? [])].map(u => u.id);
    const rawIds     = args.filter(a => /^\d{17,20}$/.test(a));
    const targetIds  = [...new Set([...mentionIds, ...rawIds])];

    if (targetIds.length === 0)
        return message.reply("❌ Aucun utilisateur ou ID valide trouvé.");

    if (targetIds.length > 25)
        return message.reply("❌ Sécurité : max **25** personnes en une seule commande.");

    // ── Raison (tout ce qui n'est ni mention ni ID) ───────────────────────────
    const reason = args
        .filter(a => !/<@!?(\d{17,20})>/.test(a) && !/^\d{17,20}$/.test(a))
        .join(' ') || 'Mass Ban';

    const protectedIds = [message.author.id, client.user.id];

    // ── Embed de confirmation ─────────────────────────────────────────────────
    // Construit la liste de mentions pour l'aperçu
    const preview = targetIds
        .slice(0, 10)
        .map(id => `<@${id}>`)
        .join(' ') + (targetIds.length > 10 ? ` … (+${targetIds.length - 10})` : '');

    const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ CONFIRMATION MASS BAN')
        .setDescription(
            `**${targetIds.length} utilisateur(s)** vont être bannis.\n\n` +
            `**Cibles :** ${preview}\n` +
            `**Raison :** ${reason}\n\n` +
            `Cette action est **irréversible**.`
        )
        .setColor('Orange')
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('confirm_banlist')
            .setLabel('✅ Confirmer')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('cancel_banlist')
            .setLabel('❌ Annuler')
            .setStyle(ButtonStyle.Secondary)
    );

    const confirmMessage = await message.channel.send({ embeds: [confirmEmbed], components: [row] });

    // ── Collector boutons (40s) ───────────────────────────────────────────────
    const collector = confirmMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 40_000,
    });

    collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id)
            return interaction.reply({ content: "❌ Seul l'auteur peut confirmer.", ephemeral: true });

        if (interaction.customId === 'cancel_banlist') {
            await interaction.update({ content: '✅ Mass ban annulé.', embeds: [], components: [] });
            return;
        }

        // Confirmation validée
        await interaction.update({ content: '🔄 Lancement du mass ban...', embeds: [], components: [] });

        const success = [];
        const failed  = [];
        let processed  = 0;

        const progressMsg = await message.channel.send(`🔄 Bannissement en cours... 0/${targetIds.length}`);

        for (const id of targetIds) {
            processed++;

            try {
                if (protectedIds.includes(id)) {
                    failed.push(`<@${id}> (protégé)`);
                    await new Promise(r => setTimeout(r, 400));
                    continue;
                }

                const user = await client.users.fetch(id).catch(() => null);
                if (!user) { failed.push(`\`${id}\` (inexistant)`); continue; }

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

            if (processed % 5 === 0 || processed === targetIds.length)
                await progressMsg.edit(`🔄 Bannissement en cours... ${processed}/${targetIds.length}`).catch(() => {});

            // Anti rate-limit
            await new Promise(r => setTimeout(r, 950));
        }

        // Résultat final
        const resultEmbed = new EmbedBuilder()
            .setTitle('🔨 Mass Ban Terminé')
            .setColor('Orange')
            .addFields(
                { name: '👮 Modérateur',      value: `${message.author}`,       inline: true },
                { name: '📊 Total tenté',      value: `${targetIds.length}`,     inline: true },
                { name: `✅ Succès (${success.length})`,
                  value: success.length > 0 ? success.join(', ').slice(0, 1024) : 'Aucun' }
            );

        if (failed.length > 0)
            resultEmbed.addFields({
                name: `❌ Échecs (${failed.length})`,
                value: failed.join(', ').slice(0, 1024),
            });

        resultEmbed.setTimestamp();
        await progressMsg.edit({ content: null, embeds: [resultEmbed] });
    });

    collector.on('end', collected => {
        if (collected.size === 0 && confirmMessage.editable)
            confirmMessage.edit({ content: '⏰ Délai expiré – Mass ban annulé.', embeds: [], components: [] }).catch(() => {});
    });
};