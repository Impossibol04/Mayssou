const { chatCompletion } = require('../../utils/openaiChat');
const { canUseAICommands } = require('../../utils/commandGuards');

module.exports = async (client, message, args) => {
    if (!canUseAICommands(message.member))
        return message.reply('❌ `ask` est réservé au staff (**Modérer les membres**).');

    const q = args.join(' ').trim();
    if (!q) return message.reply('⚠️ Utilisation : `ask <ta question>`');
    if (q.length > 1500) return message.reply('❌ Question trop longue.');

    const wait = await message.reply('🤖 Réflexion…');
    const out = await chatCompletion(q, {
        system: 'Tu es un assistant concis et utile sur Discord. Réponds en français sauf si on te parle clairement dans une autre langue.',
        maxTokens: 600,
    });

    if (!out.ok) {
        if (out.error === 'missing_key')
            return wait.edit('❌ Configure **`OPENAI_API_KEY`** sur l’hébergeur du bot pour utiliser `ask`.');
        return wait.edit(`❌ Erreur API : ${String(out.error).slice(0, 1800)}`);
    }

    const text = out.text.length > 1900 ? `${out.text.slice(0, 1897)}…` : out.text;
    await wait.edit(text);
};

module.exports.cooldown = 20;
module.exports.expensiveCooldown = 35;
