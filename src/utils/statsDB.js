const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data_db');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'stats.db'));

db.exec(`
    -- Table par événement (30 jours max) pour les stats par période
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS voice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        channelId TEXT NOT NULL,
        duration INTEGER NOT NULL,
        timestamp INTEGER NOT NULL
    );

    -- Table totaux (jamais supprimée) pour classement et stats globales
    CREATE TABLE IF NOT EXISTS messages_total (
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        count INTEGER DEFAULT 0,
        PRIMARY KEY (guildId, userId)
    );

    CREATE TABLE IF NOT EXISTS voice_total (
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        duration INTEGER DEFAULT 0,
        PRIMARY KEY (guildId, userId)
    );

    CREATE TABLE IF NOT EXISTS xp_user (
        guildId TEXT NOT NULL,
        userId TEXT NOT NULL,
        xp INTEGER NOT NULL DEFAULT 0,
        lastXpAt INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (guildId, userId)
    );
`);

// Nettoyage automatique des entrées > 30 jours au démarrage
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
db.prepare('DELETE FROM messages WHERE timestamp < ?').run(Date.now() - THIRTY_DAYS);
db.prepare('DELETE FROM voice WHERE timestamp < ?').run(Date.now() - THIRTY_DAYS);

// ==============================
// ÉCRITURE
// ==============================

function addMessage(guildId, userId, channelId) {
    // Ajoute dans la table par événement
    db.prepare('INSERT INTO messages (guildId, userId, channelId, timestamp) VALUES (?, ?, ?, ?)')
        .run(guildId, userId, channelId, Date.now());

    // Met à jour le total
    db.prepare(`
        INSERT INTO messages_total (guildId, userId, count) VALUES (?, ?, 1)
        ON CONFLICT(guildId, userId) DO UPDATE SET count = count + 1
    `).run(guildId, userId);
}

function addVoice(guildId, userId, channelId, duration) {
    if (duration <= 0) return;

    // Ajoute dans la table par événement
    db.prepare('INSERT INTO voice (guildId, userId, channelId, duration, timestamp) VALUES (?, ?, ?, ?, ?)')
        .run(guildId, userId, channelId, duration, Date.now());

    // Met à jour le total
    db.prepare(`
        INSERT INTO voice_total (guildId, userId, duration) VALUES (?, ?, ?)
        ON CONFLICT(guildId, userId) DO UPDATE SET duration = duration + ?
    `).run(guildId, userId, duration, duration);
}

// ==============================
// STATS PAR PÉRIODE
// ==============================

function getMessageStats(guildId, userId, days) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const row = db.prepare('SELECT COUNT(*) as count FROM messages WHERE guildId = ? AND userId = ? AND timestamp > ?')
        .get(guildId, userId, since);
    return row.count;
}

function getVoiceStats(guildId, userId, days) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const row = db.prepare('SELECT SUM(duration) as total FROM voice WHERE guildId = ? AND userId = ? AND timestamp > ?')
        .get(guildId, userId, since);
    return ((row.total || 0) / 3600).toFixed(2);
}

// ==============================
// STATS GLOBALES
// ==============================

function getMessageTotal(guildId, userId) {
    const row = db.prepare('SELECT count FROM messages_total WHERE guildId = ? AND userId = ?')
        .get(guildId, userId);
    return row?.count || 0;
}

function getVoiceTotal(guildId, userId) {
    const row = db.prepare('SELECT duration FROM voice_total WHERE guildId = ? AND userId = ?')
        .get(guildId, userId);
    return ((row?.duration || 0) / 3600).toFixed(2);
}

// ==============================
// CLASSEMENTS
// ==============================

function getMessageRank(guildId, userId) {
    const since = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const rows = db.prepare(`
        SELECT userId, COUNT(*) as count FROM messages 
        WHERE guildId = ? AND timestamp > ?
        GROUP BY userId ORDER BY count DESC
    `).all(guildId, since);
    const rank = rows.findIndex(r => r.userId === userId) + 1;
    return rank || null;
}

function getVoiceRank(guildId, userId) {
    const since = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const rows = db.prepare(`
        SELECT userId, SUM(duration) as total FROM voice 
        WHERE guildId = ? AND timestamp > ?
        GROUP BY userId ORDER BY total DESC
    `).all(guildId, since);
    const rank = rows.findIndex(r => r.userId === userId) + 1;
    return rank || null;
}

function getMessageLeaderboard(guildId, limit = 10) {
    return db.prepare(`
        SELECT userId, count FROM messages_total
        WHERE guildId = ?
        ORDER BY count DESC LIMIT ?
    `).all(guildId, limit);
}

function getVoiceLeaderboard(guildId, limit = 10) {
    return db.prepare(`
        SELECT userId, duration FROM voice_total
        WHERE guildId = ?
        ORDER BY duration DESC LIMIT ?
    `).all(guildId, limit);
}

// ==============================
// TOP SALONS
// ==============================

function getTopMessageChannels(guildId, userId) {
    const since = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return db.prepare(`
        SELECT channelId, COUNT(*) as count FROM messages
        WHERE guildId = ? AND userId = ? AND timestamp > ?
        GROUP BY channelId ORDER BY count DESC LIMIT 3
    `).all(guildId, userId, since);
}

function getTopVoiceChannels(guildId, userId) {
    const since = Date.now() - 14 * 24 * 60 * 60 * 1000;
    return db.prepare(`
        SELECT channelId, SUM(duration) as total FROM voice
        WHERE guildId = ? AND userId = ? AND timestamp > ?
        GROUP BY channelId ORDER BY total DESC LIMIT 3
    `).all(guildId, userId, since);
}

const XP_COOLDOWN_MS = 60_000;
const XP_MIN = 5;
const XP_MAX = 15;

/** Niveau = floor(sqrt(xp / 100)) — total XP pour atteindre le niveau L : 100 * L² */
function levelFromXp(xp) {
    return Math.floor(Math.sqrt(xp / 100));
}

function xpTotalForLevel(level) {
    return 100 * level * level;
}

function addXpMessage(guildId, userId) {
    const now = Date.now();
    const row = db.prepare('SELECT xp, lastXpAt FROM xp_user WHERE guildId = ? AND userId = ?').get(guildId, userId);
    if (row && now - row.lastXpAt < XP_COOLDOWN_MS) return null;
    const xpBefore = row?.xp ?? 0;
    const oldLevel = levelFromXp(xpBefore);
    const gain = XP_MIN + Math.floor(Math.random() * (XP_MAX - XP_MIN + 1));
    db.prepare(`
        INSERT INTO xp_user (guildId, userId, xp, lastXpAt) VALUES (?, ?, ?, ?)
        ON CONFLICT(guildId, userId) DO UPDATE SET
            xp = xp + excluded.xp,
            lastXpAt = excluded.lastXpAt
    `).run(guildId, userId, gain, now);
    const r = db.prepare('SELECT xp FROM xp_user WHERE guildId = ? AND userId = ?').get(guildId, userId);
    const newLevel = levelFromXp(r.xp);
    return {
        xp: r.xp,
        gain,
        level: newLevel,
        leveledUp: newLevel > oldLevel,
        previousLevel: oldLevel,
    };
}

function getXpUser(guildId, userId) {
    const row = db.prepare('SELECT xp FROM xp_user WHERE guildId = ? AND userId = ?').get(guildId, userId);
    const xp = row?.xp ?? 0;
    const lv = levelFromXp(xp);
    const nextTotal = xpTotalForLevel(lv + 1);
    return { xp, level: lv, nextLevelAt: nextTotal };
}

function getXpLeaderboard(guildId, limit = 10) {
    return db.prepare('SELECT userId, xp FROM xp_user WHERE guildId = ? ORDER BY xp DESC LIMIT ?').all(guildId, limit);
}

module.exports = {
    addMessage, addVoice,
    getMessageStats, getVoiceStats,
    getMessageTotal, getVoiceTotal,
    getMessageRank, getVoiceRank,
    getMessageLeaderboard, getVoiceLeaderboard,
    getTopMessageChannels, getTopVoiceChannels,
    addXpMessage, getXpUser, getXpLeaderboard, levelFromXp, xpTotalForLevel,
};