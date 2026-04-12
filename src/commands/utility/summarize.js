const { chatCompletion } = require('../../utils/openaiChat');
const { canUseAICommands } = require('../../utils/commandGuards');

module.exports = async (client, message, args) => {
    if (!canUseAICommands(message.member))
        return message.reply('❌ `summarize` est réservé au staff (**Modérer les membres**).');

    let text = args.join(' ').trim();

    if (!text && message.reference?.messageId) {
        const ref = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
        text = ref?.content?.trim() || '';
    }

    if (!text) {
        return message.reply(
            '⚠️ Utilisation : `summarize <texte>` **ou** répondre à un message avec `summarize` (sans texte).'
        );
    }

    if (text.length > 6000) return message.reply('❌ Texte trop long (max ~6000 caractères).');

    const wait = await message.reply('📝 Résumé en cours…');
    const out = await chatCompletion(
        `Résume le texte suivant en puces courtes, en français, sans inventer :\n\n---\n${text}\n---`,
        { system: 'Tu résumes fidèlement. Pas de préambule inutile.', maxTokens: 700 }
    );

    if (!out.ok) {
        if (out.error === 'missing_key')
            return wait.edit('❌ Configure **`OPENAI_API_KEY`** pour utiliser `summarize`.');
        return wait.edit(`❌ Erreur API : ${String(out.error).slice(0, 1800)}`);
    }

    const t = out.text.length > 1900 ? `${out.text.slice(0, 1897)}…` : out.text;
    await wait.edit(t);
};

module.exports.cooldown = 25;
