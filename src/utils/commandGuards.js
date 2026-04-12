const { PermissionFlagsBits } = require('discord.js');

/** Nettoie une valeur d’environnement (espaces, guillemets, retours ligne). */
function normalizeOwnerId(value) {
    if (value == null) return '';
    let s = String(value).trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1).trim();
    s = s.replace(/[\r\n\t]/g, '').trim();
    return s;
}

function getOwnerIdFromEnv() {
    return normalizeOwnerId(
        process.env.OWNER_ID || process.env.BOT_OWNER_ID || process.env.DISCORD_OWNER_ID
    );
}

/** IA : réservé aux membres qui peuvent modérer (évite abus / coût sur serveur public). */
function canUseAICommands(member) {
    return member?.permissions?.has(PermissionFlagsBits.ModerateMembers) === true;
}

function canViewInviteIntel(member) {
    return member?.permissions?.has(PermissionFlagsBits.ModerateMembers) === true;
}

function isBotOwner(userId) {
    const owner = getOwnerIdFromEnv();
    return !!owner && String(userId) === owner;
}

module.exports = { canUseAICommands, canViewInviteIntel, isBotOwner, normalizeOwnerId, getOwnerIdFromEnv };
