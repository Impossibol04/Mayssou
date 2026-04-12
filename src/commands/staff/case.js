const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getCase, listCasesForUser, listRecentCases, addCase } = require('../../utils/modCasesStore');
const theme = require('../../utils/embedTheme');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Permission **Modérer les membres** requise.')] });
    }

    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (sub && /^\d+$/.test(sub)) {
        const num = parseInt(sub, 10);
        if (!num || num < 1) {
            return message.reply(
                `⚠️ \`${p}case <numéro>\` · \`${p}case list [@membre]\` · \`${p}case add @membre <raison>\``
            );
        }
        const c = getCase(message.guild.id, num);
        if (!c) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription(`❌ Cas **#${num}** introuvable.`)] });
        }
        const mod = await client.users.fetch(c.moderatorId).catch(() => null);
        const tgt = await client.users.fetch(c.targetUserId).catch(() => null);
        const embed = new EmbedBuilder()
            .setTitle(`📎 Cas modération #${c.number}`)
            .setColor(theme.MOD)
            .addFields(
                { name: 'Type', value: `\`${c.type}\``, inline: true },
                { name: 'Membre', value: tgt ? `${tgt.tag} (${tgt.id})` : c.targetUserId, inline: true },
                { name: 'Modérateur', value: mod ? mod.tag : c.moderatorId, inline: true },
                { name: 'Raison', value: (c.reason || '—').slice(0, 1024) },
                { name: 'Date', value: `<t:${Math.floor(new Date(c.at).getTime() / 1000)}:F>`, inline: false }
            )
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    if (sub === 'list') {
        let target = message.mentions.users.first();
        if (!target && args[1] && /^\d{17,20}$/.test(args[1])) target = await client.users.fetch(args[1]).catch(() => null);
        const cases = target
            ? listCasesForUser(message.guild.id, target.id, 12)
            : listRecentCases(message.guild.id, 12);
        if (!cases.length) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(theme.INFO).setDescription('ℹ️ Aucun cas à afficher.')] });
        }
        const lines = await Promise.all(
            cases.map(async (c) => {
                const t = await client.users.fetch(c.targetUserId).catch(() => null);
                return `**#${c.number}** · \`${c.type}\` · ${t ? t.username : c.targetUserId} — <t:${Math.floor(new Date(c.at).getTime() / 1000)}:R>`;
            })
        );
        const embed = new EmbedBuilder()
            .setTitle(target ? `Cas — ${target.tag}` : 'Derniers cas (serveur)')
            .setDescription(lines.join('\n').slice(0, 4000))
            .setColor(theme.MOD);
        return message.reply({ embeds: [embed] });
    }

    if (sub === 'add') {
        let target = message.mentions.users.first();
        if (!target && args[1] && /^\d{17,20}$/.test(args[1])) target = await client.users.fetch(args[1]).catch(() => null);
        const reason = args.slice(2).join(' ').trim();
        if (!target || !reason) {
            return message.reply(`⚠️ \`${p}case add @membre <raison>\``);
        }
        const { number } = addCase(message.guild.id, {
            type: 'manuel',
            targetUserId: target.id,
            moderatorId: message.author.id,
            reason,
        });
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.SUCCESS)
                    .setDescription(`✅ Cas **#${number}** enregistré pour ${target.tag}.`),
            ],
        });
    }

    return message.reply(`⚠️ \`${p}case <n°>\` · \`${p}case list\` · \`${p}case add @membre <raison>\``);
};

module.exports.aliases = ['modcase'];

