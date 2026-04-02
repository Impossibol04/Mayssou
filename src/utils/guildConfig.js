const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/guildConfig.json');

// Lit toute la config
function readConfig() {
    if (!fs.existsSync(CONFIG_PATH)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

// Sauvegarde toute la config
function writeConfig(data) {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

// Récupère la config d'un serveur
function getGuildConfig(guildId) {
    const config = readConfig();
    return config[guildId] || {};
}

// Met à jour une clé dans la config d'un serveur
function setGuildConfig(guildId, key, value) {
    const config = readConfig();
    if (!config[guildId]) config[guildId] = {};
    config[guildId][key] = value;
    writeConfig(config);
}

module.exports = { getGuildConfig, setGuildConfig };