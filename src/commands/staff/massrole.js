const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const theme = require('../../utils/embedTheme');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ **Administrateur** requis.')],
        });
    }
    const me = message.guild.members.me;
    if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Le bot a besoin de **Gérer les rôles**.')],
        });
    }

    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';
    if (!['give', 'add', 'remove', 'take'].includes(sub)) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.WARN)
                    .setDescription(
                        `⚠️ \`${p}massrole give @Rôle confirm\` — donne le rôle à tous les humains\n\`${p}massrole remove @Rôle confirm\` — retire le rôle`
                    ),
            ],
        });
    }

    const role = message.mentions.roles.first() || (args[1] ? message.guild.roles.cache.get(args[1]) : null);
    const hasConfirm = args.some((a) => a && String(a).toLowerCase() === 'confirm');
    if (!role || !hasConfirm) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.WARN)
                    .setDescription(
                        `⚠️ Mentionne un rôle et termine par **confirm** :\n\`${p}massrole give @Rôle confirm\` ou \`${p}massrole remove @Rôle confirm\``
                    ),
            ],
        });
    }

    if (role.position >= me.roles.highest.position) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Ce rôle est au-dessus du bot.')],
        });
    }
    if (role.managed) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Rôle géré par une intégration — impossible.')],
        });
    }

    const give = sub === 'give' || sub === 'add';
    const members = await message.guild.members.fetch().catch(() => message.guild.members.cache);
    const list = [...members.values()].filter((m) => !m.user.bot);
    const targets = give ? list.filter((m) => !m.roles.cache.has(role.id)) : list.filter((m) => m.roles.cache.has(role.id));

    const wait = await message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(theme.INFO)
                .setDescription(`⏳ **${targets.length}** membre(s) à traiter — patience (anti rate-limit)…`),
        ],
    });

    let ok = 0;
    let fail = 0;
    const chunk = 5;
    for (let i = 0; i < targets.length; i += chunk) {
        const slice = targets.slice(i, i + chunk);
        await Promise.all(
            slice.map(async (m) => {
                try {
                    if (give) await m.roles.add(role, `Massrole — ${message.author.tag}`);
                    else await m.roles.remove(role, `Massrole — ${message.author.tag}`);
                    ok++;
                } catch {
                    fail++;
                }
            })
        );
        await sleep(1200);
    }

    const embed = new EmbedBuilder()
        .setTitle(give ? '✅ Massrole — ajout' : '✅ Massrole — retrait')
        .setColor(theme.SUCCESS)
        .setDescription(`Rôle : ${role}\nRéussites : **${ok}** · Échecs : **${fail}**`)
        .setTimestamp();
    await wait.edit({ embeds: [embed] }).catch(() => message.channel.send({ embeds: [embed] }));
};

module.exports.aliases = ['roleall'];
module.exports.cooldown = 60;
