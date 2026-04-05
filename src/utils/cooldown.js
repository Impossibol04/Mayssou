// src/utils/cooldown.js
const { Collection } = require('discord.js');

const COOLDOWNS = {
    '8ball' : 3,
    love    : 5,
    gay     : 5,
    rate    : 5,
    '67'    : 10,
    poll    : 15,
    confess : 30,
};

const cooldownMap = new Collection();

/**
 * Vérifie le cooldown d'une commande pour un utilisateur.
 * @returns {number|null} Secondes restantes si en cooldown, sinon null.
 */
function checkCooldown(commandName, userId) {
    const seconds = COOLDOWNS[commandName];
    if (!seconds) return null;

    if (!cooldownMap.has(commandName)) cooldownMap.set(commandName, new Collection());
    const userCDs = cooldownMap.get(commandName);
    const expiry  = userCDs.get(userId) ?? 0;

    if (Date.now() < expiry) return Math.ceil((expiry - Date.now()) / 1000);

    userCDs.set(userId, Date.now() + seconds * 1000);
    setTimeout(() => userCDs.delete(userId), seconds * 1000);
    return null;
}

module.exports = { checkCooldown };