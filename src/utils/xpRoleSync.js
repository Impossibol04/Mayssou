const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('./guildConfig');

/**
 * @param {import('discord.js').GuildMember} member
 * @param {number} level
 */
async function syncXpRoles(member, level) {
    const cfg = getGuildConfig(member.guild.id);
    const raw = cfg.xpRoleRewards;
    if (!Array.isArray(raw) || !raw.length) return;

    const me = member.guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) return;

    const sorted = [...raw]
        .filter((e) => e && typeof e.level === 'number' && typeof e.roleId === 'string')
        .sort((a, b) => a.level - b.level);

    for (const { level: need, roleId } of sorted) {
        if (level < need) continue;
        const role = member.guild.roles.cache.get(roleId);
        if (!role || role.position >= me.roles.highest.position) continue;
        if (member.roles.cache.has(roleId)) continue;
        await member.roles.add(roleId, `Palier XP niveau ${need}`).catch(() => {});
    }
}

module.exports = { syncXpRoles };
