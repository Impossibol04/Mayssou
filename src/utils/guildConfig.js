// src/utils/guildConfig.js
// Améliorations vs version originale :
//   1. Cache en mémoire → plus de fs.readFileSync à chaque commande
//   2. Écriture atomique (fichier tmp + rename) → pas de corruption si crash pendant l'écriture
//   3. setGuildConfigMulti() → modifie plusieurs clés en une seule écriture disque
//   4. deleteGuildConfigKey() → supprime une clé proprement

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const CONFIG_PATH = path.join(__dirname, '../data/guildConfig.json');

// ─── Cache en mémoire ────────────────────────────────────────────────────────
let _cache = null; // null = pas encore chargé

function _load() {
    if (_cache !== null) return _cache;
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            _cache = {};
        } else {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
            _cache = JSON.parse(raw);
        }
    } catch (err) {
        console.error('[guildConfig] Erreur lecture fichier, utilisation cache vide :', err.message);
        _cache = {};
    }
    return _cache;
}

// ─── Écriture atomique ───────────────────────────────────────────────────────
function _persist() {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Écrit dans un fichier temporaire, puis rename (opération atomique sur Linux/macOS)
    const tmp = path.join(os.tmpdir(), `guildConfig_${Date.now()}.json`);
    fs.writeFileSync(tmp, JSON.stringify(_cache, null, 2), 'utf-8');
    fs.renameSync(tmp, CONFIG_PATH);
}

// ─── API publique ────────────────────────────────────────────────────────────

/**
 * Retourne la config d'un serveur (objet vide si inexistante).
 */
function getGuildConfig(guildId) {
    const cfg = _load();
    return cfg[guildId] ?? {};
}

/**
 * Modifie UNE clé dans la config d'un serveur.
 */
function setGuildConfig(guildId, key, value) {
    const cfg = _load();
    if (!cfg[guildId]) cfg[guildId] = {};
    cfg[guildId][key] = value;
    _persist();
}

/**
 * Modifie PLUSIEURS clés en une seule écriture disque.
 * @param {string} guildId
 * @param {Record<string, any>} updates  ex: { welcomeChannel: '123', leaveChannel: '456' }
 */
function setGuildConfigMulti(guildId, updates) {
    const cfg = _load();
    if (!cfg[guildId]) cfg[guildId] = {};
    Object.assign(cfg[guildId], updates);
    _persist();
}

/**
 * Supprime une clé de la config d'un serveur.
 */
function deleteGuildConfigKey(guildId, key) {
    const cfg = _load();
    if (!cfg[guildId]) return;
    delete cfg[guildId][key];
    _persist();
}

/**
 * Recharge le cache depuis le disque (utile après un edit manuel du fichier).
 */
function reloadConfig() {
    _cache = null;
    _load();
}

module.exports = {
    getGuildConfig,
    setGuildConfig,
    setGuildConfigMulti,
    deleteGuildConfigKey,
    reloadConfig,
};