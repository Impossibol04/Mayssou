const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setGuildConfigMulti } = require('../../utils/guildConfig');
const theme = require('../../utils/embedTheme');

function cfg(gid) {
    const c = getGuildConfig(gid);
    return { jailRoleId: c.jailRoleId || null };
}

module.exports = async (client, message, args) => {
    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (sub === 'setup' || sub === 'set') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ **Administrateur** requis pour configurer la prison.')],
            });
        }
        const role = message.mentions.roles.first();
        if (!role) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription(`⚠️ \`${p}jail setup @RôlePrison\``)],
            });
        }
        const me = message.guild.members.me;
        if (!me.permissions.has(PermissionFlagsBits.ManageRoles) || role.position >= me.roles.highest.position) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(theme.ERROR)
                        .setDescription('❌ Le bot doit pouvoir gérer ce rôle (hiérarchie + **Gérer les rôles**).'),
                ],
            });
        }
        setGuildConfigMulti(message.guild.id, { jailRoleId: role.id });
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.SUCCESS)
                    .setDescription(`✅ Rôle prison défini : ${role}\nUtilise \`${p}jail @membre\` pour l’appliquer.`),
            ],
        });
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Permission **Modérer les membres** requise.')],
        });
    }

    const { jailRoleId } = cfg(message.guild.id);
    const jailRole = jailRoleId ? message.guild.roles.cache.get(jailRoleId) : null;

    if (sub === 'status') {
        const embed = new EmbedBuilder()
            .setTitle('🔒 Prison (jail)')
            .setColor(theme.INFO)
            .setDescription(jailRole ? `Rôle configuré : ${jailRole}` : `Aucun rôle — configure avec \`${p}jail setup @Rôle\` (admin).`);
        return message.reply({ embeds: [embed] });
    }

    /** jail @membre */
    let mem = message.mentions.members?.first();
    if (!mem && args[0] && /^\d{17,20}$/.test(args[0])) mem = await message.guild.members.fetch(args[0]).catch(() => null);
    if (!mem) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.WARN)
                    .setDescription(
                        `⚠️ \`${p}jail @membre\` · \`${p}unjail @membre\` · \`${p}jail setup @Rôle\` · \`${p}jail status\``
                    ),
            ],
        });
    }
    if (!jailRole) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.ERROR)
                    .setDescription(`❌ Configure d’abord le rôle : \`${p}jail setup @Rôle\` *(admin)*.`),
            ],
        });
    }
    if (mem.id === message.author.id) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ …')] });
    }
    if (mem.user.bot) {
        return message.reply({ embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Impossible sur un bot.')] });
    }
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        if (mem.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Hiérarchie : tu ne peux pas jail ce membre.')],
            });
        }
    }
    if (!mem.manageable) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Je ne peux pas modifier les rôles de ce membre.')],
        });
    }

    const reason = args.slice(message.mentions.members?.first() ? 1 : 1).join(' ').slice(0, 400) || 'Jail';
    await mem.roles.add(jailRole, `Jail — ${message.author.tag}: ${reason}`).catch(() => null);
    if (!mem.roles.cache.has(jailRole.id)) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Impossible d’ajouter le rôle prison (hiérarchie / permissions).')],
        });
    }
    return message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(theme.SUCCESS)
                .setDescription(`✅ ${mem} a reçu le rôle prison ${jailRole}.\nRetrait : \`${p}unjail @membre\``),
        ],
    });
};
