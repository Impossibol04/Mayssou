const { getGuildConfig, setGuildConfigMulti } = require('./guildConfig');

/** @type {Map<string, number[]>} */
const joinTimestamps = new Map();
/** @type {Map<string, number>} */
const raidUntil = new Map();
/** @type {Map<string, { level: import('discord.js').GuildVerificationLevel, timeout: NodeJS.Timeout }>} */
const verifyRestore = new Map();

function defaultSettings() {
    return {
        enabled: false,
        threshold: 10,
        windowSec: 15,
        verifyBump: true,
        strictNewAccounts: false,
        newAccountMaxAgeDays: 7,
        raidDurationSec: 600,
    };
}

function getAntiraidSettings(guildId) {
    const cfg = getGuildConfig(guildId);
    const raw = cfg.antiraid && typeof cfg.antiraid === 'object' ? cfg.antiraid : {};
    return { ...defaultSettings(), ...raw };
}

function saveAntiraidSettings(guildId, partial) {
    const cur = getAntiraidSettings(guildId);
    setGuildConfigMulti(guildId, { antiraid: { ...cur, ...partial } });
}

function isRaidActive(guildId) {
    const u = raidUntil.get(guildId);
    return typeof u === 'number' && u > Date.now();
}

function markRaid(guildId, durationMs) {
    const prev = raidUntil.get(guildId);
    const until = Math.max(prev || 0, Date.now() + durationMs);
    raidUntil.set(guildId, until);
    return until;
}

function pruneJoins(guildId, windowMs) {
    const now = Date.now();
    let arr = joinTimestamps.get(guildId) || [];
    arr = arr.filter((t) => now - t <= windowMs);
    joinTimestamps.set(guildId, arr);
    return arr;
}

function recordJoin(guildId) {
    const arr = joinTimestamps.get(guildId) || [];
    arr.push(Date.now());
    joinTimestamps.set(guildId, arr);
    return arr.length;
}

function clearJoins(guildId) {
    joinTimestamps.delete(guildId);
}

function cancelVerifyRestore(guildId) {
    const v = verifyRestore.get(guildId);
    if (v?.timeout) clearTimeout(v.timeout);
    verifyRestore.delete(guildId);
}

async function scheduleVerifyRestore(guild, previousLevel, delayMs) {
    cancelVerifyRestore(guild.id);
    const timeout = setTimeout(async () => {
        try {
            if (!isRaidActive(guild.id)) {
                await guild.setVerificationLevel(previousLevel, 'Antiraid : fin de mode raid');
            }
        } catch (e) {
            console.error('[antiraid] restore verification:', e.message);
        }
        verifyRestore.delete(guild.id);
    }, delayMs);
    verifyRestore.set(guild.id, { level: previousLevel, timeout });
}

module.exports = {
    getAntiraidSettings,
    saveAntiraidSettings,
    isRaidActive,
    markRaid,
    pruneJoins,
    recordJoin,
    clearJoins,
    cancelVerifyRestore,
    scheduleVerifyRestore,
    raidUntil,
};
