const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply('❌ Tu as besoin de **Bannir des membres**.');

    const page = Math.max(1, parseInt(args[0], 10) || 1);
    const perPage = 15;

    const bans = await message.guild.bans.fetch({ limit: perPage }).catch(() => null);
    if (!bans) return message.reply('❌ Impossible de récupérer la liste des bannis.');

    if (bans.size === 0) return message.reply('ℹ️ Aucun bannissement sur ce serveur.');

    const lines = [...bans.values()].map((b, i) => {
        const u = b.user;
        return `**${(page - 1) * perPage + i + 1}.** ${u.tag} (\`${u.id}\`)\n└ ${(b.reason || '—').slice(0, 80)}`;
    });

    const embed = new EmbedBuilder()
        .setTitle(`📋 Bannissements — ${message.guild.name}`)
        .setDescription(lines.join('\n\n').slice(0, 4000))
        .setColor(0xe74c3c)
        .setFooter({ text: `Affichage : ${bans.size} entrée(s) • Pagination avancée : préfixe` })
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};
