const { EmbedBuilder } = require('discord.js');
const { getXpUser, getXpLeaderboard } = require('../../utils/statsDB');

module.exports = async (client, message, args) => {
    const target = message.mentions.users.first() || message.author;
    const mem = await message.guild.members.fetch(target.id).catch(() => null);
    const { xp, level, nextLevelAt } = getXpUser(message.guild.id, target.id);
    const need = Math.max(0, nextLevelAt - xp);

    const embed = new EmbedBuilder()
        .setTitle(`📊 Niveau — ${target.username}`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setColor(0x1abc9c)
        .addFields(
            { name: 'Niveau', value: `**${level}**`, inline: true },
            { name: 'XP total', value: `**${xp}**`, inline: true },
            { name: 'Vers niveau suivant', value: `**${need}** XP restants`, inline: true }
        )
        .setFooter({ text: `Prochain palier total : ${nextLevelAt} XP` })
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

    message.channel.send({ embeds: [embed] });
};
