const { EmbedBuilder } = require('discord.js');
const { getGiveaway, deleteGiveaway } = require('./giveawayStore');
const theme = require('./embedTheme');
const log = require('./logger');

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function finalizeGiveaway(client, g) {
    const live = getGiveaway(g.guildId, g.messageId);
    if (!live || live.ended) return;
    const { saveGiveaway } = require('./giveawayStore');
    saveGiveaway(g.guildId, g.messageId, { ...live, ended: true });

    const ch = await client.channels.fetch(g.channelId).catch(() => null);
    if (!ch || !ch.isTextBased()) {
        deleteGiveaway(g.guildId, g.messageId);
        return;
    }
    const msg = await ch.messages.fetch(g.messageId).catch(() => null);
    if (!msg) {
        deleteGiveaway(g.guildId, g.messageId);
        return;
    }

    const reaction = msg.reactions?.cache.get('🎉');
    let entrants = [];
    if (reaction) {
        const fetched = await reaction.users.fetch().catch(() => null);
        if (fetched) entrants = [...fetched.values()].filter((u) => !u.bot && u.id !== client.user.id);
    }

    const prize = live.prize || g.prize || '—';
    const winCount = Math.max(1, Math.min(10, live.winnersCount || g.winnersCount || 1));
    const picked = shuffle(entrants).slice(0, winCount);
    const winnerLines =
        picked.length > 0
            ? picked.map((u) => `<@${u.id}>`).join(', ')
            : '*Aucun participant (réaction 🎉).*';

    const embed = new EmbedBuilder()
        .setTitle('🎉 Concours terminé')
        .setDescription(`**Lot :** ${prize}\n\n**Gagnant(s) :** ${winnerLines}`)
        .setColor(theme.SUCCESS)
        .setTimestamp();

    await msg.edit({ embeds: [embed], content: null }).catch(() => {});
    await ch.send({ content: picked.length ? `Bravo ${winnerLines} !` : 'Concours terminé sans participant.' }).catch(() => {});

    deleteGiveaway(g.guildId, g.messageId);
}

function schedulePendingGiveaways(client) {
    const { listActive } = require('./giveawayStore');
    for (const g of listActive()) {
        const ms = (g.endAt || 0) - Date.now();
        if (ms <= 1000) {
            finalizeGiveaway(client, g).catch((e) => log.error('giveaway finalize', { err: String(e) }));
        } else {
            setTimeout(() => {
                finalizeGiveaway(client, g).catch((e) => log.error('giveaway finalize', { err: String(e) }));
            }, ms);
        }
    }
}

module.exports = { finalizeGiveaway, schedulePendingGiveaways };
