const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const PRESET_LIMITS = [0, 2, 5, 10, 20];

/**
 * Boutons rapides sous le message de confirmation voicelimit (propriétaire du vocal temporaire).
 */
function buildVoicelimitButtonRow(channelId) {
    return new ActionRowBuilder().addComponents(
        PRESET_LIMITS.map((lim) =>
            new ButtonBuilder()
                .setCustomId(`vl:${channelId}:${lim}`)
                .setLabel(lim === 0 ? '∞ Illimité' : String(lim))
                .setStyle(lim === 0 ? ButtonStyle.Secondary : ButtonStyle.Success)
        )
    );
}

async function assertTempVoiceOwner(client, userId, voiceChannel) {
    const tempVoices = client.tempVoices;
    if (!tempVoices?.has(voiceChannel.id)) {
        return { ok: false, error: "❌ Tu ne peux modifier que ton propre vocal temporaire !" };
    }
    if (tempVoices.get(voiceChannel.id) !== userId) {
        return { ok: false, error: "❌ Ce n'est pas ton vocal !" };
    }
    return { ok: true };
}

/**
 * Applique la limite utilisateur sur le salon vocal temporaire (vérifs + setUserLimit).
 * @returns {{ ok: true, limit: number } | { ok: false, error: string }}
 */
async function applyVoiceUserLimit(client, userId, voiceChannel, limit) {
    if (isNaN(limit) || limit < 0 || limit > 99) {
        return { ok: false, error: "⚠️ Nombre invalide (0–99, 0 = illimité)." };
    }

    const own = await assertTempVoiceOwner(client, userId, voiceChannel);
    if (!own.ok) return own;

    try {
        await voiceChannel.setUserLimit(limit);
        return { ok: true, limit };
    } catch (err) {
        console.error("Erreur limit vocal:", err);
        return { ok: false, error: "❌ Impossible de modifier la limite." };
    }
}

module.exports = {
    PRESET_LIMITS,
    buildVoicelimitButtonRow,
    applyVoiceUserLimit,
    assertTempVoiceOwner,
};
