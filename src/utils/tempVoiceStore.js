const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/tempVoices.json');

function ensureDir() {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadTempVoiceMap() {
    try {
        if (!fs.existsSync(STORE_PATH)) return new Map();
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const obj = JSON.parse(raw);
        if (!obj || typeof obj !== 'object') return new Map();
        return new Map(Object.entries(obj));
    } catch {
        return new Map();
    }
}

function saveTempVoiceMap(map) {
    ensureDir();
    fs.writeFileSync(STORE_PATH, JSON.stringify(Object.fromEntries(map), null, 2), 'utf-8');
}

module.exports = {
    loadTempVoiceMap,
    saveTempVoiceMap,
};
