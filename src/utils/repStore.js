const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE = path.join(__dirname, '../data/rep.json');

let cache = null;

function load() {
    if (cache) return cache;
    try {
        cache = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {};
    } catch {
        cache = {};
    }
    return cache;
}

function save() {
    const dir = path.dirname(STORE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(os.tmpdir(), `rep_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8');
    fs.renameSync(tmp, STORE);
}

function guildBucket(guildId) {
    const db = load();
    if (!db[guildId]) db[guildId] = { counts: {}, lastDaily: {} };
    if (!db[guildId].counts) db[guildId].counts = {};
    if (!db[guildId].lastDaily) db[guildId].lastDaily = {};
    return db[guildId];
}

function getRep(guildId, userId) {
    return guildBucket(guildId).counts[userId] ?? 0;
}

function addRep(guildId, fromId, toId) {
    if (fromId === toId) return { ok: false, error: 'self' };
    const db = load();
    const g = guildBucket(guildId);
    const day = new Date().toISOString().slice(0, 10);
    const key = `${fromId}_${toId}`;
    if (g.lastDaily[key] === day) return { ok: false, error: 'cooldown' };
    g.lastDaily[key] = day;
    g.counts[toId] = (g.counts[toId] || 0) + 1;
    cache = db;
    save();
    return { ok: true };
}

module.exports = { getRep, addRep };
