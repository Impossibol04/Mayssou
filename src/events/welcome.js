const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');
const { renderWelcomeTemplate } = require('../utils/welcomeTemplate');

module.exports = (bot) => {
    bot.on('guildMemberAdd', async (member) => {
        const cfg = getGuildConfig(member.guild.id);
        if (!cfg.welcomeChannel) return;

        const channel = member.guild.channels.cache.get(cfg.welcomeChannel);
        if (!channel?.isTextBased()) return;

        const tpl = typeof cfg.welcomeTemplate === 'string' && cfg.welcomeTemplate.trim()
            ? cfg.welcomeTemplate.trim()
            : null;

        if (tpl) {
            const text = renderWelcomeTemplate(tpl, { member, guild: member.guild });
            await channel.send({ content: text.slice(0, 2000), allowedMentions: { users: [member.id] } }).catch(() => {});
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('👋 Nouveau membre !')
            .setDescription(
                `Bienvenue sur **${member.guild.name}**, ${member} !\n` +
                    `N’hésite pas à lire les règles et à te présenter.`
            )
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setColor('#2ecc71')
            .addFields(
                { name: '👤 Membre', value: `${member.user.username}`, inline: true },
                { name: '👥 Total membres', value: `${member.guild.memberCount}`, inline: true },
                { name: '📅 Compte créé', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `ID : ${member.user.id}` })
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
    });
};
