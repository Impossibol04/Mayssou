const { createInteractivePoll } = require('../../components/pollInteractive');

module.exports = async (client, message, args) => {
    const raw = args.join(' ').trim();
    if (!raw) {
        return message.reply(
            '⚠️ **Sondage oui/non** — `+poll Ta question ?`\n' +
                '**Plusieurs choix** — `+poll Question ? | Option A | Option B | Option C` *(jusqu’à 5 options)*'
        );
    }

    const parts = raw.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean);
    let question;
    let optionLabels;

    if (parts.length >= 3) {
        question = parts[0];
        optionLabels = parts.slice(1, 6);
        if (optionLabels.length < 2) {
            return message.reply('❌ Il faut au moins **2** options après les `|`.');
        }
    } else {
        question = raw;
        optionLabels = ['Oui', 'Non'];
    }

    if (question.length > 250) return message.reply('❌ Question trop longue (max 250).');
    for (const o of optionLabels) {
        if (o.length > 80) return message.reply('❌ Chaque option doit faire max **80** caractères.');
    }

    const payload = createInteractivePoll({
        question,
        optionLabels,
        authorId: message.author.id,
        authorTag: message.author.tag,
        guildId: message.guild.id,
    });

    await message.channel.send(payload);
};
