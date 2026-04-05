// src/utils/cooldown.js
const { Collection } = require('discord.js');

const cooldownMap = new Collection();

/**
 * Vérifie le cooldown d'une commande pour un utilisateur.
 * @param {string} commandName - Le nom unique de la commande.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {number} seconds - Le temps de cooldown à appliquer.
 * @returns {number|null} Secondes restantes si en cooldown, sinon null.
 */
function checkCooldown(commandName, userId, seconds) {
    // Si le cooldown est à 0 ou non défini, on ignore
    if (!seconds || seconds <= 0) return null;

    if (!cooldownMap.has(commandName)) {
        cooldownMap.set(commandName, new Collection());
    }
    
    const userCDs = cooldownMap.get(commandName);
    const expiry = userCDs.get(userId) ?? 0;

    if (Date.now() < expiry) {
        return Math.ceil((expiry - Date.now()) / 1000);
    }

    // On enregistre le nouveau cooldown
    userCDs.set(userId, Date.now() + seconds * 1000);
    
    // Nettoyage automatique
    setTimeout(() => userCDs.delete(userId), seconds * 1000);
    
    return null;
}

module.exports = { checkCooldown };