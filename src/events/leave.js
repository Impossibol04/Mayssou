const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');

module.exports = (bot) => {
    bot.on("guildMemberRemove", async (member) => {
        const cfg = getGuildConfig(member.guild.id);
        if (!cfg.leaveChannel) return;

        const channel = member.guild.channels.cache.get(cfg.leaveChannel);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle("🚪 Membre parti")
            .setDescription(`**${member.user.username}** a quitté le serveur.`)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setColor("#e74c3c")
            .addFields(
                { name: "👥 Total membres", value: `${member.guild.memberCount}`, inline: true },
                { name: "📥 Arrivé", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `ID : ${member.user.id}` })
            .setTimestamp();

        channel.send({ embeds: [embed] });
    });
};