// src/utils/modLogs.js
const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('./guildConfig');

async function sendModLog(guild, action, target, moderator, reason = "Aucune raison précisée", extra = []) {
    const cfg = getGuildConfig(guild.id);
    const logChannelId = cfg.modLogsChannel;
    if (!logChannelId) return;

    const channel = guild.channels.cache.get(logChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle(`🔨 ${action}`)
        .setColor(0xff0000)
        .setTimestamp()
        .setFooter({ text: `Modérateur • ${moderator.tag}` });

    if (target) embed.addFields({ name: "👤 Cible", value: `${target} (\`${target.id}\`)`, inline: true });
    embed.addFields({ name: "📋 Raison", value: reason, inline: true });
    extra.forEach(f => embed.addFields(f));

    channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { sendModLog };