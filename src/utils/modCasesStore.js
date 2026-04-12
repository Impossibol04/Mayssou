const fs = require('fs');
const path = require('path');
const os = require('os');

const FILE = path.join(__dirname, '../data/modCases.json');

function load() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
        return {};
    }
}

function persist(data) {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(os.tmpdir(), `modCases_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, FILE);
}

/**
 * @param {string} guildId
 * @param {{ type: string, targetUserId: string, moderatorId: string, reason: string, meta?: object }} entry
 * @returns {{ number: number }}
 */
function addCase(guildId, entry) {
    const db = load();
    if (!db[guildId]) db[guildId] = [];
    const arr = db[guildId];
    const number = arr.length ? Math.max(...arr.map((c) => c.number || 0)) + 1 : 1;
    const reason = String(entry.reason || '').slice(0, 900);
    const row = {
        number,
        type: String(entry.type || 'unknown').slice(0, 32),
        targetUserId: entry.targetUserId,
        moderatorId: entry.moderatorId,
        reason,
        at: new Date().toISOString(),
        meta: entry.meta && typeof entry.meta === 'object' ? entry.meta : undefined,
    };
    arr.push(row);
    persist(db);
    return { number };
}

function getCase(guildId, num) {
    const arr = load()[guildId] || [];
    const n = parseInt(num, 10);
    return arr.find((c) => c.number === n) || null;
}

function listCasesForUser(guildId, userId, limit = 10) {
    const arr = load()[guildId] || [];
    return arr
        .filter((c) => c.targetUserId === userId)
        .slice(-limit)
        .reverse();
}

function listRecentCases(guildId, limit = 15) {
    const arr = load()[guildId] || [];
    return arr.slice(-limit).reverse();
}

module.exports = { addCase, getCase, listCasesForUser, listRecentCases };
