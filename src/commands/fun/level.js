const { EmbedBuilder } = require('discord.js');
const { getXpUser, getXpLeaderboard, xpTotalForLevel } = require('../../utils/statsDB');
const { getGuildConfig } = require('../../utils/guildConfig');
const theme = require('../../utils/embedTheme');

module.exports = async (client, message, args) => {
    const target = message.mentions.users.first() || message.author;
    const mem = await message.guild.members.fetch(target.id).catch(() => null);
    const { xp, level, nextLevelAt } = getXpUser(message.guild.id, target.id);
    const need = Math.max(0, nextLevelAt - xp);
    const prevTotal = level > 0 ? xpTotalForLevel(level) : 0;
    const span = Math.max(1, nextLevelAt - prevTotal);
    const pct = Math.min(100, Math.round(((xp - prevTotal) / span) * 100));

    const rawRewards = getGuildConfig(message.guild.id).xpRoleRewards;
    const rewards = Array.isArray(rawRewards) ? [...rawRewards].sort((a, b) => a.level - b.level) : [];
    const rewardLines = rewards.length
        ? await Promise.all(
              rewards.map(async (e) => {
                  const r = message.guild.roles.cache.get(e.roleId);
                  const ok = level >= e.level ? '✅' : '○';
                  return `${ok} Niv. **${e.level}** → ${r ? r.toString() : `\`${e.roleId}\``}`;
              })
          )
        : ['*Aucun rôle XP — \`setxprole add\`*'];

    const embed = new EmbedBuilder()
        .setTitle(`📊 Niveau — ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setColor(theme.INFO)
        .addFields(
            { name: 'Niveau', value: `**${level}**`, inline: true },
            { name: 'XP total', value: `**${xp}**`, inline: true },
            { name: 'Progression', value: `**${need}** XP → niv. ${level + 1} (${pct}%)`, inline: true },
            { name: '🏅 Rôles XP (serveur)', value: rewardLines.join('\n').slice(0, 900) }
        )
        .setFooter({ text: `Paliers : niveau suivant à ${nextLevelAt} XP cumulés` })
        .setTimestamp();

    const top = getXpLeaderboard(message.guild.id, 5);
    if (top.length) {
        const lines = await Promise.all(
            top.map(async (r, i) => {
                const u = await client.users.fetch(r.userId).catch(() => null);
                return `**${i + 1}.** ${u ? u.username : r.userId} — ${r.xp} XP`;
            })
        );
        embed.addFields({ name: 'Top 5 XP (serveur)', value: lines.join('\n').slice(0, 900) });
    }

    return message.channel.send({ embeds: [embed] });
};
