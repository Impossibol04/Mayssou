const fs = require('fs');
const path = require('path');
const os = require('os');

const FILE = path.join(__dirname, '../data/giveaways.json');

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
    const tmp = path.join(os.tmpdir(), `giveaways_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, FILE);
}

function key(guildId, messageId) {
    return `${guildId}:${messageId}`;
}

function saveGiveaway(guildId, messageId, data) {
    const db = load();
    const k = key(guildId, messageId);
    const prev = db[k] || {};
    db[k] = { ...prev, guildId, messageId, ...data };
    persist(db);
}

function getGiveaway(guildId, messageId) {
    return load()[key(guildId, messageId)] || null;
}

function deleteGiveaway(guildId, messageId) {
    const db = load();
    delete db[key(guildId, messageId)];
    persist(db);
}

function listActive() {
    return Object.values(load()).filter((g) => g && !g.ended);
}

module.exports = { saveGiveaway, getGiveaway, deleteGiveaway, listActive };
