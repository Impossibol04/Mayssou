const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE = path.join(__dirname, '../data/modnotes.json');

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
    const tmp = path.join(os.tmpdir(), `modnotes_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf8');
    fs.renameSync(tmp, STORE);
}

function addNote(guildId, targetUserId, moderatorId, text) {
    const db = load();
    if (!db[guildId]) db[guildId] = [];
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const entry = { id, targetUserId, moderatorId, text: String(text).slice(0, 900), at: new Date().toISOString() };
    db[guildId].push(entry);
    cache = db;
    save();
    return entry;
}

function listNotes(guildId, targetUserId, limit = 15) {
    const db = load();
    const arr = (db[guildId] || []).filter((n) => n.targetUserId === targetUserId);
    return arr.slice(-limit);
}

function deleteNote(guildId, noteId) {
    const db = load();
    if (!db[guildId]) return false;
    const i = db[guildId].findIndex((n) => n.id === noteId);
    if (i === -1) return false;
    db[guildId].splice(i, 1);
    cache = db;
    save();
    return true;
}

module.exports = { addNote, listNotes, deleteNote };
