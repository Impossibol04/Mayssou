const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE = path.join(__dirname, '../../data_db/guildBlacklist.json');

function load() {
    try {
        if (!fs.existsSync(STORE)) return [];
        const j = JSON.parse(fs.readFileSync(STORE, 'utf8'));
        return Array.isArray(j) ? j : [];
    } catch {
        return [];
    }
}

function save(ids) {
    const dir = path.dirname(STORE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(os.tmpdir(), `gbl_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(ids, null, 2), 'utf8');
    fs.renameSync(tmp, STORE);
}

function listIds() {
    return load();
}

function addId(id) {
    const ids = new Set(load());
    ids.add(String(id));
    save([...ids]);
}

function removeId(id) {
    const ids = load().filter((x) => String(x) !== String(id));
    save(ids);
}

function isBlacklisted(guildId) {
    return load().includes(String(guildId));
}

module.exports = { listIds, addId, removeId, isBlacklisted };
