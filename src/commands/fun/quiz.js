const { EmbedBuilder } = require('discord.js');
const { buildQuizPayload } = require('../../components/quizInteractive');
const { getLeaderboard } = require('../../utils/quizStore');

module.exports = async (client, message, args) => {
    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (sub === 'top' || sub === 'lb' || sub === 'leaderboard') {
        const rows = getLeaderboard(message.guild.id, 10);
        if (!rows.length) {
            return message.reply('ℹ️ Aucun score enregistré. Lance un quiz avec `+quiz` !');
        }
        const lines = await Promise.all(
            rows.map(async (r, i) => {
                const u = await client.users.fetch(r.userId).catch(() => null);
                return `**${i + 1}.** ${u ? u.tag : r.userId} — **${r.total}** pt(s)`;
            })
        );
        const embed = new EmbedBuilder()
            .setTitle('🏆 Quiz — classement')
            .setColor(0xf1c40f)
            .setDescription(lines.join('\n'))
            .setTimestamp();
        return message.channel.send({ embeds: [embed] });
    }

    const cat = sub && ['culture', 'anime', 'gaming', 'mix'].includes(sub) ? sub : 'mix';
    const payload = buildQuizPayload({
        authorId: message.author.id,
        authorTag: message.author.tag,
        guildId: message.guild.id,
        category: cat,
    });

    if (!payload) return message.reply('❌ Impossible de charger les questions.');

    await message.channel.send(payload);
};
