const { getGuildConfig } = require('../../utils/guildConfig');

const LANGS = new Set(['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'nl', 'pl', 'ar']);

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
            if (j.translatedText) return { ok: true, translatedText: j.translatedText, detected: j.detectedLanguage?.language };
        } catch {
            continue;
        }
    }
    return { ok: false };
}

module.exports = async (client, message, args) => {
    if (getGuildConfig(message.guild.id).disableTranslate === true)
        return message.reply('❌ La traduction automatique est **désactivée** sur ce serveur.');

    const loc = (getGuildConfig(message.guild.id).locale || 'fr').toLowerCase();
    let target = loc === 'en' ? 'en' : 'fr';
    let text;

    if (args[0] && LANGS.has(args[0].toLowerCase())) {
        target = args[0].toLowerCase();
        text = args.slice(1).join(' ').trim();
    } else {
        text = args.join(' ').trim();
    }

    if (!text) {
        return message.reply(
            '⚠️ `translate <texte>` ou `translate <lang> <texte>` (lang : en, fr, es, de, …).\n' +
                `Langue cible par défaut selon \`language\` du serveur (**${target}**).`
        );
    }

    if (text.length > 2000) return message.reply('❌ Texte trop long (max 2000 caractères).');

    const wait = await message.reply('🌐 Traduction…');
    const out = await libreTranslate(text, target, 'auto');
    if (!out.ok) {
        await wait.edit('❌ Service de traduction indisponible. Réessaie plus tard.');
        return;
    }

    await wait.edit(
        `**${target.toUpperCase()}**${out.detected ? ` (détecté: ${out.detected})` : ''}\n${out.translatedText}`.slice(0, 2000)
    );
};
