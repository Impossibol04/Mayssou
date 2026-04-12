const { getGuildConfig, setGuildConfig } = require('../../utils/guildConfig');

/** Entrée JJ/MM → stockage MM-JJ */
function parseFrenchDayMonth(raw) {
    const m = raw.trim().match(/^(\d{1,2})[\/-](\d{1,2})$/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatStored(mmdd) {
    if (!mmdd || mmdd.length < 5) return mmdd;
    return `${mmdd.slice(3, 5)}/${mmdd.slice(0, 2)}`;
}

module.exports = async (client, message, args) => {
    const raw = args[0];
    if (!raw) {
        const cfg = getGuildConfig(message.guild.id);
        const map = cfg.birthdays && typeof cfg.birthdays === 'object' ? cfg.birthdays : {};
        const mine = map[message.author.id];
        return message.reply(
            mine
                ? `🎂 Date enregistrée (jour/mois) : **${formatStored(mine)}**`
                : '⚠️ Utilisation : `setbirthday JJ/MM` — exemple : `setbirthday 14/07`'
        );
    }

    const parsed = parseFrenchDayMonth(raw);
    if (!parsed) return message.reply('⚠️ Format attendu : `JJ/MM` (ex. `14/07`).');

    const cfg = getGuildConfig(message.guild.id);
    const map = { ...(cfg.birthdays && typeof cfg.birthdays === 'object' ? cfg.birthdays : {}) };
    map[message.author.id] = parsed;
    setGuildConfig(message.guild.id, 'birthdays', map);

    message.reply(`✅ Anniversaire enregistré : **${formatStored(parsed)}**.`);
};
