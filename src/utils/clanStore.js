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

/**
 * @returns {{ clans: Record<string, object>, wars: Record<string, object> }}
 */
function getGuildData(guildId) {
    const db = load();
    let g = db[guildId];
    if (!g) {
        g = { clans: {}, wars: {} };
        db[guildId] = g;
        persist(db);
        return g;
    }
    if (!g.clans) {
        const clans = {};
        const wars = {};
        for (const [k, v] of Object.entries(g)) {
            if (k === 'wars' && v && typeof v === 'object' && !v.ownerId) {
                Object.assign(wars, v);
                continue;
            }
            if (v && typeof v === 'object' && v.ownerId) clans[k] = migrateClanFields(v);
        }
        db[guildId] = { clans, wars };
        persist(db);
        return db[guildId];
    }
    if (!g.wars) g.wars = {};
    for (const tag of Object.keys(g.clans)) {
        g.clans[tag] = migrateClanFields(g.clans[tag]);
    }
    return g;
}

function migrateClanFields(c) {
    if (!c) return c;
    if (c.xp == null) c.xp = 0;
    if (!Array.isArray(c.rivals)) c.rivals = [];
    if (c.roleId == null) c.roleId = null;
    if (c.challengeTo == null) c.challengeTo = null;
    return c;
}

function saveGuildData(guildId, data) {
    const db = load();
    db[guildId] = data;
    persist(db);
}

function normalizeTag(tag) {
    return String(tag || '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
}

function warKey(tagA, tagB) {
    const a = normalizeTag(tagA);
    const b = normalizeTag(tagB);
    return [a, b].sort().join('|');
}

/** Niveau clan : même courbe que l’XP utilisateur (sqrt) */
function clanLevelFromXp(xp) {
    return Math.floor(Math.sqrt(xp / 100));
}

function xpTotalForClanLevel(level) {
    return 100 * level * level;
}

function guildClans(guildId) {
    return getGuildData(guildId).clans;
}

function getWars(guildId) {
    return getGuildData(guildId).wars;
}

function getClan(guildId, tag) {
    const t = normalizeTag(tag);
    const c = guildClans(guildId)[t] || null;
    if (!c) return null;
    return migrateClanFields(c);
}

function setClan(guildId, tag, clan) {
    const t = normalizeTag(tag);
    const g = getGuildData(guildId);
    g.clans[t] = migrateClanFields(clan);
    saveGuildData(guildId, g);
}

function deleteClan(guildId, tag) {
    const t = normalizeTag(tag);
    const g = getGuildData(guildId);
    delete g.clans[t];
    for (const k of Object.keys(g.wars)) {
        const w = g.wars[k];
        if (w && (normalizeTag(w.tag1) === t || normalizeTag(w.tag2) === t)) delete g.wars[k];
    }
    for (const c of Object.values(g.clans)) {
        if (!c) continue;
        c.rivals = (c.rivals || []).filter((x) => normalizeTag(x) !== t);
        if (normalizeTag(c.challengeTo) === t) c.challengeTo = null;
    }
    saveGuildData(guildId, g);
}

function userClanTag(guildId, userId) {
    const g = guildClans(guildId);
    for (const [tag, c] of Object.entries(g)) {
        if (c.ownerId === userId || (c.members || []).includes(userId)) return tag;
    }
    return null;
}

/**
 * Ajoute de l’XP au clan d’un membre (messages) et met à jour les scores de guerre.
 * @returns {{ tag: string, clanXp: number, level: number, warGain?: number } | null}
 */
function addClanXpFromActivity(guildId, userId, amount) {
    if (!amount || amount <= 0) return null;
    const tag = userClanTag(guildId, userId);
    if (!tag) return null;
    const g = getGuildData(guildId);
    const c = g.clans[tag];
    if (!c) return null;
    c.xp = Math.max(0, (c.xp || 0) + Math.floor(amount));
    let warGain = 0;
    for (const [key, w] of Object.entries(g.wars)) {
        if (!w) continue;
        const t1 = normalizeTag(w.tag1);
        const t2 = normalizeTag(w.tag2);
        if (t1 !== tag && t2 !== tag) continue;
        const add = Math.max(1, Math.floor(amount / 3));
        warGain += add;
        if (t1 === tag) w.score1 = (w.score1 || 0) + add;
        else w.score2 = (w.score2 || 0) + add;
        g.wars[key] = w;
    }
    saveGuildData(guildId, g);
    return {
        tag,
        clanXp: c.xp,
        level: clanLevelFromXp(c.xp),
        warGain: warGain || undefined,
    };
}

function listClansSorted(guildId) {
    const g = guildClans(guildId);
    return Object.entries(g)
        .map(([tag, c]) => ({
            tag,
            name: c.name,
            xp: c.xp || 0,
            level: clanLevelFromXp(c.xp || 0),
            members: 1 + (c.members || []).length,
        }))
        .sort((a, b) => b.xp - a.xp || a.tag.localeCompare(b.tag));
}

function setWarEntry(guildId, key, entry) {
    const g = getGuildData(guildId);
    g.wars[key] = entry;
    saveGuildData(guildId, g);
}

function removeWarEntry(guildId, key) {
    const g = getGuildData(guildId);
    delete g.wars[key];
    saveGuildData(guildId, g);
}

module.exports = {
    normalizeTag,
    warKey,
    getClan,
    setClan,
    deleteClan,
    guildClans,
    getGuildData,
    getWars,
    userClanTag,
    clanLevelFromXp,
    xpTotalForClanLevel,
    addClanXpFromActivity,
    listClansSorted,
    setWarEntry,
    removeWarEntry,
};
