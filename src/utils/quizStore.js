const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE = path.join(__dirname, '../data/quizScores.json');

function load() {
    try {
        if (!fs.existsSync(STORE)) return {};
        return JSON.parse(fs.readFileSync(STORE, 'utf-8'));
    } catch {
        return {};
    }
}

function persist(data) {
    const dir = path.dirname(STORE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(os.tmpdir(), `quiz_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, STORE);
}

function addScore(guildId, userId, category, won) {
    const db = load();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId][userId]) db[guildId][userId] = { total: 0, culture: 0, anime: 0, gaming: 0 };
    const u = db[guildId][userId];
    if (won) {
        u.total += 1;
        if (category && u[category] !== undefined) u[category] += 1;
    }
    persist(db);
    return u;
}

function getLeaderboard(guildId, limit = 10) {
    const db = load();
    const g = db[guildId] || {};
    return Object.entries(g)
        .map(([userId, s]) => ({ userId, total: s.total || 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, limit);
}

module.exports = { addScore, getLeaderboard, load };
