const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../../utils/guildConfig');
const theme = require('../../utils/embedTheme');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Permission **Modérer les membres** requise.')],
        });
    }
    const jailRoleId = getGuildConfig(message.guild.id).jailRoleId;
    const jailRole = jailRoleId ? message.guild.roles.cache.get(jailRoleId) : null;
    if (!jailRole) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Aucun rôle prison configuré (`jail setup`).')],
        });
    }
    let mem = message.mentions.members?.first();
    if (!mem && args[0] && /^\d{17,20}$/.test(args[0])) mem = await message.guild.members.fetch(args[0]).catch(() => null);
    if (!mem) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription('⚠️ `unjail @membre`')],
        });
    }
    if (!mem.roles.cache.has(jailRole.id)) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription('ℹ️ Ce membre n’a pas le rôle prison.')],
        });
    }
    await mem.roles.remove(jailRole, `Unjail — ${message.author.tag}`).catch(() => null);
    return message.reply({
        embeds: [new EmbedBuilder().setColor(theme.SUCCESS).setDescription(`✅ ${mem} — rôle prison retiré.`)],
    });
};
