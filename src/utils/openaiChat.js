/**
 * Appel minimal à l’API OpenAI (chat completions).
 * Définis `OPENAI_API_KEY` dans l’environnement. Optionnel : `OPENAI_MODEL` (défaut gpt-4o-mini).
 */
async function chatCompletion(userContent, { system = null, maxTokens = 500 } = {}) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return { ok: false, error: 'missing_key' };

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: userContent });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    });

    const raw = await res.text();
    if (!res.ok) return { ok: false, error: raw.slice(0, 500) };

    let json;
    try {
        json = JSON.parse(raw);
    } catch {
        return { ok: false, error: 'Réponse JSON invalide.' };
    }

    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: 'Réponse vide du modèle.' };
    return { ok: true, text };
}

module.exports = { chatCompletion };
