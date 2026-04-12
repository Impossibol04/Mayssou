const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getWarns } = require('../../utils/warnStore');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply('❌ Il faut **Modérer les membres**.');

    const targetId = message.mentions.users.first()?.id || args[0];
    if (!targetId) return message.reply('⚠️ Utilisation : `warnlist @membre` ou `warnlist <ID>`');

    const user =
        message.mentions.users.first() || (await client.users.fetch(targetId).catch(() => null));
    if (!user) return message.reply('❌ Utilisateur introuvable.');

    const warns = getWarns(message.guild.id, targetId);
    if (!warns.length) return message.reply(`ℹ️ Aucun warn enregistré pour **${user.tag}**.`);

    const lines = warns.map((w, i) => {
        const when = w.at ? `<t:${Math.floor(new Date(w.at).getTime() / 1000)}:d>` : '—';
        return `**${i + 1}.** ${when} — ${(w.reason || '—').slice(0, 200)}`;
    });

    const embed = new EmbedBuilder()
        .setTitle(`⚠️ Warns — ${user.tag}`)
        .setDescription(lines.join('\n').slice(0, 4000))
        .setColor(0xf1c40f)
        .setFooter({ text: `${warns.length} entrée(s)` })
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};
