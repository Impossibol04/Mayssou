const fs = require('fs');
const path = require('path');
const os = require('os');

const FILE = path.join(__dirname, '../data/clans.json');

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
    const tmp = path.join(os.tmpdir(), `clans_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, FILE);
}

function guildClans(guildId) {
    const db = load();
    if (!db[guildId]) db[guildId] = {};
    return db[guildId];
}

function saveGuild(guildId, obj) {
    const db = load();
    db[guildId] = obj;
    persist(db);
}

function normalizeTag(tag) {
    return String(tag || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
}

function getClan(guildId, tag) {
    const t = normalizeTag(tag);
    return guildClans(guildId)[t] || null;
}

function setClan(guildId, tag, clan) {
    const t = normalizeTag(tag);
    const g = guildClans(guildId);
    g[t] = clan;
    saveGuild(guildId, g);
}

function deleteClan(guildId, tag) {
    const t = normalizeTag(tag);
    const g = guildClans(guildId);
    delete g[t];
    saveGuild(guildId, g);
}

function userClanTag(guildId, userId) {
    const g = guildClans(guildId);
    for (const [tag, c] of Object.entries(g)) {
        if (c.ownerId === userId || (c.members || []).includes(userId)) return tag;
    }
    return null;
}

module.exports = {
    normalizeTag,
    getClan,
    setClan,
    deleteClan,
    guildClans,
    userClanTag,
};
