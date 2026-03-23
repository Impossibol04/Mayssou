const { addVoice } = require('../utils/statsDB');

const voiceSessions = new Map();

module.exports = (bot) => {
    bot.voiceSessions = voiceSessions;

    // Récupère les sessions en cours au démarrage
    bot.once('ready', () => {
        setTimeout(() => {
            for (const guild of bot.guilds.cache.values()) {
                for (const [, state] of guild.voiceStates.cache) {
                    if (!state.channelId || state.member?.user.bot) continue;
                    const key = `${state.id}_${guild.id}`;
                    if (!voiceSessions.has(key)) {
                        voiceSessions.set(key, {
                            channelId: state.channelId,
                            startTime: Date.now()
                        });
                    }
                }
            }
            console.log(`✅ Sessions vocales récupérées : ${voiceSessions.size}`);
        }, 2000);
    });

    bot.on("voiceStateUpdate", (oldState, newState) => {
        const userId = newState.member?.id || oldState.member?.id;
        const guildId = newState.guild?.id || oldState.guild?.id;
        if (!userId || !guildId) return;
        if (newState.member?.user.bot) return;

        const key = `${userId}_${guildId}`;

        if (!oldState.channelId && newState.channelId) {
            voiceSessions.set(key, { channelId: newState.channelId, startTime: Date.now() });
        } else if (oldState.channelId && !newState.channelId) {
            const session = voiceSessions.get(key);
            if (session) {
                const duration = Math.floor((Date.now() - session.startTime) / 1000);
                addVoice(guildId, userId, session.channelId, duration);
                voiceSessions.delete(key);
            }
        } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            const session = voiceSessions.get(key);
            if (session) {
                const duration = Math.floor((Date.now() - session.startTime) / 1000);
                addVoice(guildId, userId, session.channelId, duration);
            }
            voiceSessions.set(key, { channelId: newState.channelId, startTime: Date.now() });
        }
    });
};