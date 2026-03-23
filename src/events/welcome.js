const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');

module.exports = (bot) => {
    bot.on("guildMemberAdd", async (member) => {
        const cfg = getGuildConfig(member.guild.id);
        if (!cfg.welcomeChannel) return;

        const channel = member.guild.channels.cache.get(cfg.welcomeChannel);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle("👋 Nouveau membre !")
            .setDescription(`Bienvenue sur **${member.guild.name}**, ${member} !`)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setColor("#2ecc71")
            .addFields(
                { name: "👤 Membre", value: `${member.user.username}`, inline: true },
                { name: "👥 Total membres", value: `${member.guild.memberCount}`, inline: true },
                { name: "📅 Compte créé", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `ID : ${member.user.id}` })
            .setTimestamp();

        channel.send({ embeds: [embed] });
    });
};