const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    const text = args.join(' ').trim();
    if (!text) return message.reply('⚠️ `report <explication>` — signale un problème au staff (salon logs mod).');

    const cfg = getGuildConfig(message.guild.id);
    const logId = cfg.modLogsChannel;
    if (!logId) return message.reply('❌ Aucun salon **modlogs** configuré (`setmodlogs`).');

    const logCh = message.guild.channels.cache.get(logId);
    if (!logCh?.isTextBased()) return message.reply('❌ Salon de logs invalide.');

    const embed = new EmbedBuilder()
        .setTitle('🚨 Signalement')
        .setColor(0xe74c3c)
        .addFields(
            { name: 'Auteur', value: `${message.author} (\`${message.author.id}\`)`, inline: false },
            { name: 'Salon', value: `${message.channel} (\`${message.channel.id}\`)`, inline: false },
            { name: 'Détails', value: text.slice(0, 3500) }
        )
        .setTimestamp();

    await logCh.send({ embeds: [embed], content: '**Nouveau report** — merci de traiter.' }).catch(() => null);
    message.reply('✅ Ton signalement a été transmis au staff.');
};

module.exports.cooldown = 120;
