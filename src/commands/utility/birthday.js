const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../../utils/guildConfig');

function formatMmDd(mmdd) {
    if (!mmdd || mmdd.length < 5) return mmdd;
    return `${mmdd.slice(3, 5)}/${mmdd.slice(0, 2)}`;
}

module.exports = async (client, message, args) => {
    const cfg = getGuildConfig(message.guild.id);
    const map = cfg.birthdays && typeof cfg.birthdays === 'object' ? cfg.birthdays : {};
    const entries = Object.entries(map);
    if (!entries.length) return message.reply('ℹ️ Aucun anniversaire enregistré. Utilise `setbirthday JJ/MM`.');

    const rows = await Promise.all(
        entries.map(async ([uid, mmdd]) => {
            const u = await client.users.fetch(uid).catch(() => null);
            const tag = u ? u.tag : uid;
            return { tag, uid, mmdd, sort: mmdd };
        })
    );

    rows.sort((a, b) => a.sort.localeCompare(b.sort) || a.tag.localeCompare(b.tag));

    const lines = rows.map((r) => `**${formatMmDd(r.mmdd)}** — ${r.tag} (\`${r.uid}\`)`);

    const embed = new EmbedBuilder()
        .setTitle(`🎂 Anniversaires enregistrés — ${message.guild.name}`)
        .setDescription(lines.join('\n').slice(0, 4000))
        .setColor(0xff9ff3)
        .setFooter({ text: `${rows.length} membre(s) • format stocké MM-JJ (affichage JJ/MM)` })
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};
