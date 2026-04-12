const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setGuildConfigMulti } = require('../../utils/guildConfig');

function getRewards(guildId) {
    const raw = getGuildConfig(guildId).xpRoleRewards;
    return Array.isArray(raw) ? [...raw] : [];
}

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('❌ Permission **Gérer le serveur** requise.');
    }

    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (!sub || sub === 'list') {
        const list = getRewards(message.guild.id).sort((a, b) => a.level - b.level);
        if (!list.length) {
            return message.reply(`ℹ️ Aucun rôle XP. Ajoute avec \`${p}setxprole add <niveau> @Rôle\`.`);
        }
        const lines = list.map((e) => {
            const r = message.guild.roles.cache.get(e.roleId);
            return `**Niv. ${e.level}** → ${r ? r.toString() : e.roleId}`;
        });
        return message.reply(['🏅 **Rôles XP**', ...lines].join('\n'));
    }

    if (sub === 'clear') {
        setGuildConfigMulti(message.guild.id, { xpRoleRewards: [] });
        return message.reply('✅ Liste des rôles XP **vidée**.');
    }

    if (sub === 'add') {
        const n = parseInt(args[1], 10);
        const role = message.mentions.roles.first();
        if (isNaN(n) || n < 1 || n > 500 || !role) {
            return message.reply(`⚠️ \`${p}setxprole add <niveau> @Rôle\``);
        }
        const me = message.guild.members.me;
        if (me && role.position >= me.roles.highest.position) {
            return message.reply('❌ Ce rôle est au-dessus du bot — impossible de l’attribuer.');
        }
        let list = getRewards(message.guild.id).filter((e) => e.roleId !== role.id);
        list.push({ level: n, roleId: role.id });
        list.sort((a, b) => a.level - b.level);
        setGuildConfigMulti(message.guild.id, { xpRoleRewards: list });
        return message.reply(`✅ Au niveau **${n}**, le bot donnera ${role}.`);
    }

    if (sub === 'remove' || sub === 'del') {
        const role = message.mentions.roles.first();
        if (!role) return message.reply(`⚠️ \`${p}setxprole remove @Rôle\``);
        const list = getRewards(message.guild.id).filter((e) => e.roleId !== role.id);
        setGuildConfigMulti(message.guild.id, { xpRoleRewards: list });
        return message.reply('✅ Entrée supprimée (si elle existait).');
    }

    return message.reply(`⚠️ \`${p}setxprole list | add <niv> @role | remove @role | clear\``);
};
