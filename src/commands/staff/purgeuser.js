const { PermissionFlagsBits } = require('discord.js');

const MAX_ROUNDS = 8;
const FETCH = 100;
const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
        return message.reply('❌ Il faut **Gérer les messages**.');

    const targetId = message.mentions.users.first()?.id || args[0];
    const limitTotal = Math.min(500, Math.max(1, parseInt(args[message.mentions.users.first() ? 1 : 1], 10) || 50));

    if (!targetId) return message.reply('⚠️ `purgeuser @membre [nombre max 500]` — messages < 14 jours seulement.');

    let deleted = 0;
    let rounds = 0;

    while (deleted < limitTotal && rounds < MAX_ROUNDS) {
        rounds++;
        const batch = await message.channel.messages.fetch({ limit: FETCH }).catch(() => null);
        if (!batch?.size) break;

        const now = Date.now();
        const toDel = batch.filter(
            (m) =>
                m.author.id === targetId &&
                !m.pinned &&
                now - m.createdTimestamp < TWO_WEEKS &&
                m.id !== message.id
        );
        if (!toDel.size) break;

        const slice = [...toDel.values()].slice(0, Math.min(100, limitTotal - deleted));
        if (!slice.length) break;

        await message.channel.bulkDelete(slice, true).catch(() => null);
        deleted += slice.length;
    }

    message.reply(`🧹 **${deleted}** message(s) de <@${targetId}> supprimé(s) (limite ${limitTotal}, < 14 jours).`);
};

module.exports.cooldown = 10;
