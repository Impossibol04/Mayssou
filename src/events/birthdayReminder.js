const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');

function todayMmDd() {
    const d = new Date();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${m}-${day}`;
}

module.exports = (bot) => {
    let lastDay = '';

    setInterval(async () => {
        const key = todayMmDd();
        if (key === lastDay) return;
        lastDay = key;

        for (const guild of bot.guilds.cache.values()) {
            try {
                const cfg = getGuildConfig(guild.id);
                const map = cfg.birthdays && typeof cfg.birthdays === 'object' ? cfg.birthdays : {};
                const hits = Object.entries(map).filter(([, v]) => v === key);
                if (!hits.length) continue;

                const ch = guild.systemChannel;
                if (!ch?.isTextBased()) continue;

                const lines = [];
                for (const [uid] of hits) {
                    const u = await bot.users.fetch(uid).catch(() => null);
                    lines.push(u ? `🎂 **${u.username}**` : `🎂 <@${uid}>`);
                }

                const embed = new EmbedBuilder()
                    .setTitle('🎂 Anniversaires du jour (UTC)')
                    .setDescription(lines.join('\n'))
                    .setColor(0xff9ff3)
                    .setTimestamp();

                await ch.send({ embeds: [embed] }).catch(() => {});
            } catch (e) {
                console.error('[birthday]', guild.id, e.message);
            }
        }
    }, 60 * 1000);
};
