const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ViewAuditLog))
        return message.reply('❌ Il faut **Voir les journaux d’audit**.');

    const n = Math.min(25, Math.max(5, parseInt(args[0], 10) || 15));

    const logs = await message.guild.fetchAuditLogs({ limit: n }).catch(() => null);
    if (!logs) return message.reply('❌ Impossible de lire le journal d’audit.');

    const lines = [...logs.entries.values()].map((e) => {
        const who = e.executor ? e.executor.tag : '—';
        const tgt = e.target ? (e.target.tag || e.target.name || e.target.id) : '—';
        return `**${e.action}** — ${who} → ${String(tgt).slice(0, 40)}`;
    });

    const embed = new EmbedBuilder()
        .setTitle(`📜 Audit — ${message.guild.name}`)
        .setDescription(lines.join('\n').slice(0, 4000))
        .setColor(0x34495e)
        .setFooter({ text: `${logs.entries.size} entrée(s)` })
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};

module.exports.cooldown = 15;
