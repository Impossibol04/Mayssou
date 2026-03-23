const { AttachmentBuilder } = require('discord.js');
const { generateLeaderboardCard } = require('../../utils/leaderboardCard');
const { getMessageLeaderboard, getVoiceLeaderboard } = require('../../utils/statsDB');

module.exports = async (client, message, args) => {
    const guildId = message.guild.id;
    const loading = await message.reply("⏳ Génération du classement...");

    const resolveUsername = async (userId) => {
        try {
            const member = await message.guild.members.fetch(userId).catch(() => null);
            return member?.user.username || userId;
        } catch { return userId; }
    };

    const msgTopRaw = getMessageLeaderboard(guildId, 8);
    const voiceTopRaw = getVoiceLeaderboard(guildId, 8);

    // Ajoute les sessions vocales en cours au leaderboard
    const voiceSessions = client.voiceSessions;
    const liveMap = new Map();
    if (voiceSessions) {
        for (const [key, session] of voiceSessions) {
            const [userId, gId] = key.split('_');
            if (gId !== guildId) continue;
            const liveSeconds = Math.floor((Date.now() - session.startTime) / 1000);
            liveMap.set(userId, liveSeconds);
        }
    }

    // Fusionne les totaux DB + sessions live
    const voiceMap = new Map();
    for (const r of voiceTopRaw) {
        voiceMap.set(r.userId, r.duration + (liveMap.get(r.userId) || 0));
    }
    // Ajoute les membres en vocal non présents dans le top
    for (const [userId, liveSeconds] of liveMap) {
        if (!voiceMap.has(userId)) voiceMap.set(userId, liveSeconds);
    }
    const voiceTopMerged = [...voiceMap.entries()]
        .map(([userId, duration]) => ({ userId, duration }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 8);

    const msgTop = await Promise.all(msgTopRaw.map(async r => ({
        username: await resolveUsername(r.userId),
        count: r.count
    })));

    const voiceTop = await Promise.all(voiceTopMerged.map(async r => ({
        username: await resolveUsername(r.userId),
        duration: r.duration
    })));

    const data = { guildName: message.guild.name, msgTop, voiceTop };

    try {
        const buffer = await generateLeaderboardCard(data);
        const attachment = new AttachmentBuilder(buffer, { name: 'leaderboard.png' });
        await loading.delete().catch(() => {});
        message.channel.send({ files: [attachment] });
    } catch (err) {
        console.error("Erreur génération leaderboard:", err);
        await loading.edit("❌ Erreur lors de la génération du classement.");
    }
};

module.exports.aliases = ['lb', 'top'];