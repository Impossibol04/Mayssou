/** @type {Map<string, Map<string, { reason: string, at: number }>>} */
const afk = new Map();

function guildMap(guildId) {
    if (!afk.has(guildId)) afk.set(guildId, new Map());
    return afk.get(guildId);
}

function setAfk(guildId, userId, reason) {
    guildMap(guildId).set(userId, { reason, at: Date.now() });
}

function getAfk(guildId, userId) {
    return guildMap(guildId).get(userId) || null;
}

function clearAfk(guildId, userId) {
    guildMap(guildId).delete(userId);
}

module.exports = { setAfk, getAfk, clearAfk };
