const { PermissionFlagsBits } = require('discord.js');

/** IA : réservé aux membres qui peuvent modérer (évite abus / coût sur serveur public). */
function canUseAICommands(member) {
    return member?.permissions?.has(PermissionFlagsBits.ModerateMembers) === true;
}

function canViewInviteIntel(member) {
    return member?.permissions?.has(PermissionFlagsBits.ModerateMembers) === true;
}

function isBotOwner(userId) {
    const owner = process.env.OWNER_ID || process.env.BOT_OWNER_ID;
    return owner && String(userId) === String(owner);
}

module.exports = { canUseAICommands, canViewInviteIntel, isBotOwner };
