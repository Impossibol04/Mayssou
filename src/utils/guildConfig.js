// src/utils/guildConfig.js
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(__dirname, '../data/guildConfig.json');

let _cache = null;

function _load() {
    if (_cache !== null) return _cache;
    try {
        if (!fs.existsSync(CONFIG_PATH)) _cache = {};
        else _cache = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
        _cache = {};
    }
    return _cache;
}

function _persist() {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const tmp = path.join(os.tmpdir(), `guildConfig_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(_cache, null, 2), 'utf-8');
    fs.renameSync(tmp, CONFIG_PATH);
}

function getGuildConfig(guildId) {
    const cfg = _load();
    return cfg[guildId] ?? {};
}

function setGuildConfig(guildId, key, value) {
    const cfg = _load();
    if (!cfg[guildId]) cfg[guildId] = {};
    cfg[guildId][key] = value;
    _persist();
}

function setGuildConfigMulti(guildId, updates) {
    const cfg = _load();
    if (!cfg[guildId]) cfg[guildId] = {};
    Object.assign(cfg[guildId], updates);
    _persist();
}

function deleteGuildConfigKey(guildId, key) {
    const cfg = _load();
    if (!cfg[guildId]) return;
    delete cfg[guildId][key];
    _persist();
}

module.exports = {
    getGuildConfig,
    setGuildConfig,
    setGuildConfigMulti,
    deleteGuildConfigKey,
    reloadConfig: () => { _cache = null; _load(); }
};