const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE_PATH = path.join(__dirname, '../data/warns.json');

let _cache = null;

function _load() {
    if (_cache !== null) return _cache;
    try {
        if (!fs.existsSync(STORE_PATH)) _cache = {};
        else _cache = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    } catch {
        _cache = {};
    }
    return _cache;
}

function _persist() {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(os.tmpdir(), `warns_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(_cache, null, 2), 'utf-8');
    fs.renameSync(tmp, STORE_PATH);
}

function getWarns(guildId, userId) {
    const db = _load();
    return db[guildId]?.[userId] ?? [];
}

function addWarn(guildId, userId, entry) {
    const db = _load();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId][userId]) db[guildId][userId] = [];
    db[guildId][userId].push({
        reason: entry.reason,
        moderatorId: entry.moderatorId,
        at: entry.at || new Date().toISOString(),
    });
    _persist();
}

function clearWarnsForUser(guildId, userId) {
    const db = _load();
    if (!db[guildId]?.[userId]) return 0;
    const n = db[guildId][userId].length;
    delete db[guildId][userId];
    if (Object.keys(db[guildId]).length === 0) delete db[guildId];
    _persist();
    return n;
}

function clearAllWarnsInGuild(guildId) {
    const db = _load();
    if (!db[guildId]) return 0;
    let total = 0;
    for (const uid of Object.keys(db[guildId])) {
        total += db[guildId][uid].length;
    }
    delete db[guildId];
    _persist();
    return total;
}

module.exports = { getWarns, addWarn, clearWarnsForUser, clearAllWarnsInGuild };
