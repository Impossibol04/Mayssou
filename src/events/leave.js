const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');
const { renderWelcomeTemplate } = require('../utils/welcomeTemplate');

module.exports = (bot) => {
    bot.on('guildMemberRemove', async (member) => {
        const cfg = getGuildConfig(member.guild.id);
        if (!cfg.leaveChannel) return;

        const channel = member.guild.channels.cache.get(cfg.leaveChannel);
        if (!channel?.isTextBased()) return;

        const tpl = typeof cfg.leaveTemplate === 'string' && cfg.leaveTemplate.trim()
            ? cfg.leaveTemplate.trim()
            : null;

        if (tpl) {
            const text = renderWelcomeTemplate(tpl, { member, guild: member.guild });
            await channel.send({ content: text.slice(0, 2000) }).catch(() => {});
            return;
        }

        const joined = member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            : '—';

        const embed = new EmbedBuilder()
            .setTitle('🚪 Membre parti')
            .setDescription(`**${member.user.username}** a quitté le serveur.`)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setColor('#e74c3c')
            .addFields(
                { name: '👥 Total membres', value: `${member.guild.memberCount}`, inline: true },
                { name: '📥 Était là depuis', value: joined, inline: true }
            )
            .setFooter({ text: `ID : ${member.user.id}` })
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
    });
};
