const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = async (client, message, args) => {
    // 1. Vérifications de permissions
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply("❌ Tu n'as pas la permission de bannir des membres.");
    }

    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply("❌ **Le bot** n'a pas la permission de bannir des membres.");
    }

    if (!args[0]) {
        return message.reply("⚠️ Utilisation : `+banlist @user1 @user2 ID3 [raison ici]`");
    }

    // 2. Extraction des cibles (mentions + IDs bruts) + suppression des doublons
    const targetIds = [...new Set([
        ...message.mentions.users.map(u => u.id),
        ...args.filter(arg => /^\d{17,19}$/.test(arg))
    ])];

    if (targetIds.length === 0) {
        return message.reply("❌ Aucun utilisateur ou ID valide trouvé.");
    }

    if (targetIds.length > 25) {
        return message.reply("❌ Sécurité : Tu ne peux pas bannir plus de **25** personnes en une seule commande.");
    }

    // 3. Récupération de la raison (tout ce qui n'est ni une mention ni un ID)
    const reasonParts = args.filter(arg => 
        !/<@!?(\d{17,19})>/.test(arg) && !/^\d{17,19}$/.test(arg)
    );
    const reason = reasonParts.length > 0 ? reasonParts.join(' ') : "Mass Ban";

    const protectedIds = [message.author.id, client.user.id];

    // 4. Embed de confirmation (très important !)
    const confirmEmbed = new EmbedBuilder()
        .setTitle("⚠️ CONFIRMATION MASS BAN")
        .setDescription(`**${targetIds.length} utilisateur(s)** vont être bannis.\n\n**Raison :** ${reason}\n\nCette action est **irréversible**.`)
        .setColor("Orange")
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

    const confirmMessage = await message.channel.send({ 
        embeds: [confirmEmbed], 
        components: [row] 
    });

    // 5. Collector de boutons (40 secondes pour confirmer)
    const collector = confirmMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 40000
    });

    collector.on('collect', async interaction => {
        if (interaction.user.id !== message.author.id) {
            return interaction.reply({ content: "❌ Seul l'auteur de la commande peut confirmer.", ephemeral: true });
        }

        if (interaction.customId === 'cancel_banlist') {
            await interaction.update({ content: "✅ Mass ban annulé.", embeds: [], components: [] });
            return;
        }

        // === CONFIRMATION VALIDÉE ===
        await interaction.update({ content: "🔄 Lancement du mass ban...", embeds: [], components: [] });

        const success = [];
        const failed = [];
        let processed = 0;

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
                if (!user) {
                    failed.push(`\`${id}\` (inexistant)`);
                    continue;
                }

                const member = await message.guild.members.fetch(id).catch(() => null);
                if (member && !member.bannable) {
                    failed.push(`${user.tag} (trop haut gradé)`);
                    continue;
                }

                await message.guild.members.ban(id, { 
                    reason: `${reason} | Par ${message.author.tag}` 
                });

                success.push(user.tag || id);

            } catch (err) {
                failed.push(`\`${id}\` (erreur)`);
            }

            // Mise à jour de la progression (toutes les 5 bans + à la fin)
            if (processed % 5 === 0 || processed === targetIds.length) {
                await progressMsg.edit(`🔄 Bannissement en cours... ${processed}/${targetIds.length}`).catch(() => {});
            }

            // Délai anti-rate limit (très important !)
            await new Promise(r => setTimeout(r, 950));
        }

        // 6. Embed final de résultat
        const resultEmbed = new EmbedBuilder()
            .setTitle("🔨 Mass Ban Terminé")
            .setColor("Orange")
            .addFields(
                { name: "👮 Modérateur", value: `${message.author}`, inline: true },
                { name: "📊 Total tenté", value: `${targetIds.length}`, inline: true },
                { name: `✅ Succès (${success.length})`, value: success.length > 0 ? success.join(", ").substring(0, 1024) : "Aucun" }
            );

        if (failed.length > 0) {
            resultEmbed.addFields({ 
                name: `❌ Échecs (${failed.length})`, 
                value: failed.join(", ").substring(0, 1024) 
            });
        }

        resultEmbed.setTimestamp();

        await progressMsg.edit({ content: null, embeds: [resultEmbed] });
    });

    // Si personne ne répond dans les 40 secondes
    collector.on('end', collected => {
        if (collected.size === 0 && confirmMessage.editable) {
            confirmMessage.edit({ content: "⏰ Délai expiré – Mass ban annulé.", embeds: [], components: [] }).catch(() => {});
        }
    });
};