const { getGuildConfig } = require('../../utils/guildConfig');
const { translateText } = require('../../utils/translateEngine');

const LANGS = new Set(['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'nl', 'pl', 'ar', 'ko']);

module.exports = async (client, message, args) => {
    if (getGuildConfig(message.guild.id).disableTranslate === true)
        return message.reply('❌ La traduction est **désactivée** sur ce serveur (`settranslate`).');

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
            '⚠️ `translate <texte>` ou `translate <lang> <texte>`\n' +
                `Langues : ${[...LANGS].slice(0, 8).join(', ')}…\n` +
                `Cible par défaut : **${target}** (voir \`language\` du serveur).`
        );
    }

    if (text.length > 2000) return message.reply('❌ Texte trop long (max 2000 caractères).');

    const wait = await message.reply('🌐 Traduction…');
    const out = await translateText(text, target);
    if (!out.ok) {
        await wait.edit(
            '❌ Aucun service de traduction disponible. Vérifie la connexion ou installe `google-translate-api-x` (`npm i`).'
        );
        return;
    }

    const src = out.source === 'google' ? 'Google' : 'LibreTranslate';
    await wait.edit(
        (
            `**${target.toUpperCase()}**` +
            (out.detected ? ` · détecté \`${out.detected}\`` : '') +
            ` · _${src}_\n` +
            out.translatedText
        ).slice(0, 2000)
    );
};
