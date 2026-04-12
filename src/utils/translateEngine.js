/**
 * Chaîne de traduction : Google (google-translate-api-x) → LibreTranslate public.
 */

let translateGoogle = null;
try {
    translateGoogle = require('google-translate-api-x').translate;
} catch {
    translateGoogle = null;
}

async function libreTranslate(text, target, source = 'auto') {
    const endpoints = [
        'https://libretranslate.de/translate',
        'https://translate.argosopentech.com/translate',
    ];
    const body = JSON.stringify({ q: text, source, target, format: 'text' });

    for (const url of endpoints) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            });
            if (!res.ok) continue;
            const j = await res.json();
            if (j.translatedText) {
                return { ok: true, translatedText: j.translatedText, detected: j.detectedLanguage?.language };
            }
        } catch {
            continue;
        }
    }
    return { ok: false };
}

/**
 * @param {string} text
 * @param {string} target - code langue ISO (fr, en, …)
 * @returns {Promise<{ ok: boolean, translatedText?: string, detected?: string, source?: string }>}
 */
async function translateText(text, target) {
    if (translateGoogle) {
        try {
            const r = await translateGoogle(text, { to: target });
            const out = r?.text || r;
            if (typeof out === 'string' && out.length) {
                return {
                    ok: true,
                    translatedText: out,
                    detected: r?.from?.language?.iso,
                    source: 'google',
                };
            }
        } catch (e) {
            console.warn('[translate] Google:', e.message);
        }
    }

    const lib = await libreTranslate(text, target, 'auto');
    if (lib.ok) return { ...lib, source: 'libre' };
    return { ok: false };
}

module.exports = { translateText, libreTranslate };
