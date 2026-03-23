const { AttachmentBuilder } = require('discord.js');
const { generateStatsCard } = require('../../utils/statsCard');
const {
    getMessageStats, getVoiceStats,
    getMessageTotal, getVoiceTotal,
    getMessageRank, getVoiceRank,
    getTopMessageChannels, getTopVoiceChannels
} = require('../../utils/statsDB');

module.exports = async (client, message, args) => {
    const target = message.mentions.members.first() || message.member;
    const user = target.user;
    const guildId = message.guild.id;
    const userId = user.id;

    const loading = await message.reply("⏳ Génération de la carte...");

    // Calcule le temps vocal en cours si le membre est en vocal
    const voiceSession = client.voiceSessions?.get(`${userId}_${guildId}`);
    const liveVoiceSeconds = voiceSession
        ? Math.floor((Date.now() - voiceSession.startTime) / 1000)
        : 0;

    const addLiveVoice = (hours) => {
        return ((parseFloat(hours) * 3600 + liveVoiceSeconds) / 3600).toFixed(2);
    };

    const resolveChannel = (channelId) => {
        const ch = message.guild.channels.cache.get(channelId);
        return ch ? ch.name : channelId;
    };

    const topMsgRaw = getTopMessageChannels(guildId, userId);
    const topVoiceRaw = getTopVoiceChannels(guildId, userId);

    // Ajoute le temps live au top salon vocal en cours
    const currentChannelId = voiceSession?.channelId;
    const topVoiceWithLive = topVoiceRaw.map(c => ({
        channelId: c.channelId,
        total: c.total + (c.channelId === currentChannelId ? liveVoiceSeconds : 0)
    }));
    // Si le salon actuel n'est pas dans le top, on l'ajoute
    if (currentChannelId && !topVoiceRaw.find(c => c.channelId === currentChannelId)) {
        topVoiceWithLive.push({ channelId: currentChannelId, total: liveVoiceSeconds });
    }
    topVoiceWithLive.sort((a, b) => b.total - a.total);

    const data = {
        username:    user.username,
        avatarUrl:   user.displayAvatarURL({ extension: 'png', size: 256 }),
        guildName:   message.guild.name,
        createdAt:   new Date(user.createdTimestamp).toLocaleDateString('fr-FR'),
        joinedAt:    new Date(target.joinedTimestamp).toLocaleDateString('fr-FR'),
        msg1d:       getMessageStats(guildId, userId, 1),
        msg7d:       getMessageStats(guildId, userId, 7),
        msg14d:      getMessageStats(guildId, userId, 14),
        msgTotal:    getMessageTotal(guildId, userId),
        voice1d:     addLiveVoice(getVoiceStats(guildId, userId, 1)),
        voice7d:     addLiveVoice(getVoiceStats(guildId, userId, 7)),
        voice14d:    addLiveVoice(getVoiceStats(guildId, userId, 14)),
        voiceTotal:  addLiveVoice(getVoiceTotal(guildId, userId)),
        msgRank:     getMessageRank(guildId, userId),
        voiceRank:   getVoiceRank(guildId, userId),
        topMsgChannels:   topMsgRaw.map(c => ({ name: resolveChannel(c.channelId), count: c.count })),
        topVoiceChannels: topVoiceWithLive.slice(0, 3).map(c => ({ name: resolveChannel(c.channelId), total: c.total })),
    };

    try {
        const buffer = await generateStatsCard(data);
        const attachment = new AttachmentBuilder(buffer, { name: 'stats.png' });
        await loading.delete().catch(() => {});
        message.channel.send({ files: [attachment] });
    } catch (err) {
        console.error("Erreur génération carte:", err);
        await loading.edit("❌ Erreur lors de la génération de la carte.");
    }
};