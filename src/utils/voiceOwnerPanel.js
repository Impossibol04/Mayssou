const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    PermissionFlagsBits,
} = require('discord.js');
const { applyVoiceUserLimit, PRESET_LIMITS } = require('./voiceLimitShared');

/** Réponses en MP : pas d’ephemeral (Discord). En serveur : ephemeral. */
function ownerReplyOpts(interaction, content) {
    if (interaction.inGuild()) return { content, flags: MessageFlags.Ephemeral };
    return { content };
}

function buildOwnerEmbed(voiceChannel, guild) {
    return new EmbedBuilder()
        .setTitle('🎛️ Contrôle de ton vocal temporaire')
        .setColor(0x5865f2)
        .setDescription(
            [
                `**Salon :** ${voiceChannel.name}`,
                `**Serveur :** ${guild.name}`,
                '',
                '· **Renommer** — nouveau nom (sans le préfixe 🔊)',
                '· **Limite** — nombre de places (0–99, 0 = illimité)',
                '· **Exclure** — déconnecte quelqu’un qui est dans ton vocal',
                '· **Bloquer** — empêche quelqu’un de rejoindre ce salon',
                '',
                '**Préréglages** — limite en un clic (ligne du bas)',
                '',
                '*Les commandes `voicename`, `voicelimit`, etc. restent disponibles.*',
            ].join('\n')
        )
        .setFooter({ text: 'Message privé — seul toi vois ce panneau' });
}

function buildOwnerComponents(channelId) {
    const rowMain = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`vcp:rn:${channelId}`)
            .setLabel('Renommer')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`vcp:lm:${channelId}`)
            .setLabel('Limite')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`vcp:xp:${channelId}`)
            .setLabel('Exclure')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`vcp:bl:${channelId}`)
            .setLabel('Bloquer')
            .setStyle(ButtonStyle.Danger)
    );
    const rowQuick = new ActionRowBuilder().addComponents(
        PRESET_LIMITS.map((lim) =>
            new ButtonBuilder()
                .setCustomId(`vcp:ql:${channelId}:${lim}`)
                .setLabel(lim === 0 ? 'Illimité' : String(lim))
                .setStyle(lim === 0 ? ButtonStyle.Secondary : ButtonStyle.Success)
        )
    );
    return [rowMain, rowQuick];
}

async function sendVoiceOwnerPanel(client, member, voiceChannel) {
    const embed = buildOwnerEmbed(voiceChannel, member.guild);
    const components = buildOwnerComponents(voiceChannel.id);

    if (voiceChannel.isTextBased && voiceChannel.isTextBased()) {
        try {
            await voiceChannel.send({
                content: `${member} — voici le panneau de contrôle de ton salon vocal temporaire :`,
                embeds: [embed],
                components,
            });
            return;
        } catch (error) {
            console.error('sendVoiceOwnerPanel voiceChannel send failed:', error);
        }
    }

    try {
        await member.user.send({ embeds: [embed], components });
    } catch (error) {
        console.error('sendVoiceOwnerPanel DM failed:', error);
    }
}

function parseOwnerChannelId(interaction) {
    const map = interaction.client.tempVoices;
    if (!map) return null;
    const uid = interaction.user.id;

    const tryId = (channelId) => {
        if (!channelId || !map.has(channelId) || map.get(channelId) !== uid) return null;
        return channelId;
    };

    if (interaction.isModalSubmit()) {
        const m = interaction.customId.match(/^vcp:m:(rn|lm|xp|bl):(\d+)$/);
        return m ? tryId(m[2]) : null;
    }
    if (interaction.isButton()) {
        let m = interaction.customId.match(/^vcp:(rn|lm|xp|bl):(\d+)$/);
        if (m) return tryId(m[2]);
        m = interaction.customId.match(/^vcp:ql:(\d+):(\d+)$/);
        if (m) return tryId(m[1]);
    }
    return null;
}

async function fetchTempVoiceChannel(client, channelId) {
    const ch = await client.channels.fetch(channelId).catch(() => null);
    if (!ch || !ch.isVoiceBased()) return null;
    return ch;
}

async function showRenameModal(interaction, channelId) {
    const modal = new ModalBuilder().setCustomId(`vcp:m:rn:${channelId}`).setTitle('Renommer le vocal');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('vcp_name')
                .setLabel('Nouveau nom (max 32 caractères)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(32)
                .setRequired(true)
        )
    );
    await interaction.showModal(modal);
}

async function showLimitModal(interaction, channelId) {
    const modal = new ModalBuilder().setCustomId(`vcp:m:lm:${channelId}`).setTitle('Limite de places');
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('vcp_limit')
                .setLabel('Nombre (0 = illimité, max 99)')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(2)
                .setRequired(true)
        )
    );
    await interaction.showModal(modal);
}

async function showKickModal(interaction, channelId, title, customSuffix) {
    const modal = new ModalBuilder().setCustomId(`vcp:m:${customSuffix}:${channelId}`).setTitle(title);
    modal.addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId('vcp_user')
                .setLabel('ID Discord du membre (clic droit → Copier l’identifiant)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(17)
                .setMaxLength(20)
                .setRequired(true)
        )
    );
    await interaction.showModal(modal);
}

function snowflakeOk(s) {
    return /^\d{17,20}$/.test((s || '').trim());
}

/**
 * Gère boutons / modales du panneau propriétaire (souvent en MP).
 * @returns {boolean} true si l’interaction a été consommée
 */
async function handleVoiceOwnerPanelInteraction(bot, interaction) {
    if (interaction.isButton() && interaction.customId.startsWith('vcp:')) {
        const channelId = parseOwnerChannelId(interaction);
        if (!channelId) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ Tu n’es pas propriétaire de ce salon (ou il n’existe plus).')).catch(() => {});
            return true;
        }

        const quick = interaction.customId.match(/^vcp:ql:(\d+):(\d+)$/);
        if (quick) {
            const lim = parseInt(quick[2], 10);
            const voice = await fetchTempVoiceChannel(bot, channelId);
            if (!voice) {
                await interaction.reply(ownerReplyOpts(interaction, '❌ Salon introuvable.')).catch(() => {});
                return true;
            }
            const result = await applyVoiceUserLimit(bot, interaction.user.id, voice, lim);
            if (!result.ok) {
                await interaction.reply(ownerReplyOpts(interaction, result.error)).catch(() => {});
                return true;
            }
            await interaction.reply(
                ownerReplyOpts(
                    interaction,
                    result.limit === 0
                        ? '🔓 **Limite :** illimité.'
                        : `👥 **Limite :** ${result.limit} place(s).`
                )
            ).catch(() => {});
            return true;
        }

        const action = interaction.customId.match(/^vcp:(rn|lm|xp|bl):(\d+)$/);
        if (!action) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ Interaction invalide.')).catch(() => {});
            return true;
        }
        const kind = action[1];
        try {
            if (kind === 'rn') await showRenameModal(interaction, channelId);
            else if (kind === 'lm') await showLimitModal(interaction, channelId);
            else if (kind === 'xp') await showKickModal(interaction, channelId, 'Exclure du vocal', 'xp');
            else if (kind === 'bl') await showKickModal(interaction, channelId, 'Bloquer l’accès', 'bl');
        } catch (e) {
            console.error('voice panel modal:', e);
        }
        return true;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('vcp:m:')) {
        const channelId = parseOwnerChannelId(interaction);
        if (!channelId) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ Action invalide ou salon supprimé.')).catch(() => {});
            return true;
        }

        const voice = await fetchTempVoiceChannel(bot, channelId);
        if (!voice) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ Salon vocal introuvable.')).catch(() => {});
            return true;
        }

        const map = bot.tempVoices;
        if (!map?.has(channelId) || map.get(channelId) !== interaction.user.id) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ Ce n’est pas ton vocal.')).catch(() => {});
            return true;
        }

        const type = interaction.customId.match(/^vcp:m:(rn|lm|xp|bl):(\d+)$/);
        if (!type) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ Formulaire inconnu.')).catch(() => {});
            return true;
        }

        const kind = type[1];
        const guild = voice.guild;

        if (kind === 'rn') {
            let name = interaction.fields.getTextInputValue('vcp_name').trim();
            if (!name) {
                await interaction.reply(ownerReplyOpts(interaction, '❌ Nom vide.')).catch(() => {});
                return true;
            }
            if (name.length > 32) name = name.slice(0, 32);
            try {
                await voice.setName(`🔊 ${name}`);
                await interaction.reply(ownerReplyOpts(interaction, `✅ Salon renommé en **🔊 ${name}**.`));
            } catch (e) {
                console.error(e);
                await interaction.reply(ownerReplyOpts(interaction, '❌ Impossible de renommer.')).catch(() => {});
            }
            return true;
        }

        if (kind === 'lm') {
            const raw = interaction.fields.getTextInputValue('vcp_limit').trim();
            const n = parseInt(raw, 10);
            const result = await applyVoiceUserLimit(bot, interaction.user.id, voice, n);
            if (!result.ok) {
                await interaction.reply(ownerReplyOpts(interaction, result.error)).catch(() => {});
                return true;
            }
            await interaction.reply(
                ownerReplyOpts(
                    interaction,
                    result.limit === 0
                        ? '🔓 **Limite :** illimité.'
                        : `👥 **Limite :** ${result.limit} place(s).`
                )
            ).catch(() => {});
            return true;
        }

        const targetRaw = interaction.fields.getTextInputValue('vcp_user').trim();
        if (!snowflakeOk(targetRaw)) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ ID invalide.')).catch(() => {});
            return true;
        }
        const targetMember = await guild.members.fetch(targetRaw).catch(() => null);
        if (!targetMember) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ Membre introuvable sur ce serveur.')).catch(() => {});
            return true;
        }
        if (targetMember.id === interaction.user.id) {
            await interaction.reply(ownerReplyOpts(interaction, '❌ Tu ne peux pas te cibler toi-même.')).catch(() => {});
            return true;
        }

        if (kind === 'xp') {
            if (targetMember.voice.channelId !== channelId) {
                await interaction.reply(ownerReplyOpts(interaction, '❌ Ce membre n’est pas dans ton vocal.')).catch(() => {});
                return true;
            }
            try {
                await targetMember.voice.disconnect();
                await interaction.reply(
                    ownerReplyOpts(interaction, `✅ **${targetMember.user.username}** a été exclu du vocal.`)
                );
            } catch (e) {
                console.error(e);
                await interaction.reply(ownerReplyOpts(interaction, '❌ Impossible de déconnecter ce membre.')).catch(() => {});
            }
            return true;
        }

        if (kind === 'bl') {
            try {
                await voice.permissionOverwrites.create(targetMember.id, { Connect: false });
                if (targetMember.voice.channelId === channelId) {
                    await targetMember.voice.disconnect().catch(() => {});
                }
                await interaction.reply(
                    ownerReplyOpts(
                        interaction,
                        `✅ **${targetMember.user.username}** ne peut plus rejoindre ce salon.`
                    )
                );
            } catch (e) {
                console.error(e);
                await interaction.reply(ownerReplyOpts(interaction, '❌ Impossible de modifier les permissions.')).catch(() => {});
            }
            return true;
        }
    }

    return false;
}

module.exports = {
    sendVoiceOwnerPanel,
    handleVoiceOwnerPanelInteraction,
    buildOwnerEmbed,
    buildOwnerComponents,
};
