const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');
const { loadTempVoiceMap, saveTempVoiceMap } = require('../utils/tempVoiceStore');
const { sendVoiceOwnerPanel } = require('../utils/voiceOwnerPanel');

const tempVoices = loadTempVoiceMap();

module.exports = (bot) => {
    bot.voiceSessions = bot.voiceSessions || new Map();
    bot.tempVoices = tempVoices;

    bot.once('ready', async () => {
        let changed = false;

        // Nettoie les vocaux temporaires qui n'existent plus
        for (const channelId of [...tempVoices.keys()]) {
            const ch = bot.channels.cache.get(channelId)
                || await bot.channels.fetch(channelId).catch(() => null);
            if (!ch) {
                tempVoices.delete(channelId);
                changed = true;
            }
        }
        if (changed) saveTempVoiceMap(tempVoices);

        // Vérifie que les hubs configurés existent encore
        for (const guild of bot.guilds.cache.values()) {
            const cfg = getGuildConfig(guild.id);
            if (!cfg.joinVoiceChannel) continue;
            const hub = guild.channels.cache.get(cfg.joinVoiceChannel)
                || await guild.channels.fetch(cfg.joinVoiceChannel).catch(() => null);
            if (!hub) {
                console.warn(`[autoVoice] Hub introuvable sur ${guild.name} (${guild.id}) — reconfigure avec +setjoinvoice`);
            } else {
                console.log(`[autoVoice] Hub OK : "${hub.name}" sur ${guild.name}`);
            }
        }
    });

    bot.on('voiceStateUpdate', async (oldState, newState) => {
        const guildId = newState.guild?.id || oldState.guild?.id;
        const cfg = getGuildConfig(guildId);
        const hubRaw = cfg.joinVoiceChannel;
        if (!hubRaw) return;

        const hubId = String(hubRaw);
        const guild = newState.guild || oldState.guild;
        let member = newState.member || oldState.member;
        const userId = newState.id;

        if (!member && userId) {
            try {
                member = await guild.members.fetch({ user: userId, force: true });
            } catch (e) {
                console.error(`[autoVoice] Impossible de charger le membre ${userId}:`, e.message);
                return;
            }
        }
        if (!member || member.user.bot) return;

        // ===========================
        // REJOINT LE SALON HUB → crée un vocal privé
        // ===========================
        if (newState.channelId === hubId) {
            let newChannel = null;

            // Évite de créer deux vocaux pour le même membre
            const existingEntry = [...tempVoices.entries()].find(([, ownerId]) => ownerId === member.id);
            if (existingEntry) {
                const [existingChannelId] = existingEntry;
                const existingChannel = guild.channels.cache.get(existingChannelId)
                    || await guild.channels.fetch(existingChannelId).catch(() => null);

                if (existingChannel) {
                    if (existingChannel.members.size === 0) {
                        await existingChannel.delete().catch(() => {});
                        tempVoices.delete(existingChannelId);
                        saveTempVoiceMap(tempVoices);
                    } else {
                        return;
                    }
                } else {
                    tempVoices.delete(existingChannelId);
                    saveTempVoiceMap(tempVoices);
                }
            }

            try {
                // Fetch le hub pour avoir sa catégorie même si pas en cache
                const hubChannel = guild.channels.cache.get(hubId)
                    || await guild.channels.fetch(hubId).catch(() => null);
                const category = hubChannel?.parent ?? newState.channel?.parent ?? null;

                const displayName = member.displayName || member.user.username;
                newChannel = await guild.channels.create({
                    name: `🔊 ${displayName}`.slice(0, 100),
                    type: ChannelType.GuildVoice,
                    parent: category,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: member.id,
                            allow: [
                                PermissionFlagsBits.Connect,
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.ManageChannels,
                                PermissionFlagsBits.MuteMembers,
                                PermissionFlagsBits.MoveMembers,
                            ],
                        },
                    ],
                });

                tempVoices.set(newChannel.id, member.id);
                saveTempVoiceMap(tempVoices);

                await member.voice.setChannel(newChannel);

                // Envoie le panel dans le tchat du vocal temporaire
                await sendVoiceOwnerPanel(bot, member, newChannel).catch((e) =>
                    console.error('[autoVoice] Panneau propriétaire:', e.message)
                );
            } catch (err) {
                console.error(`[autoVoice] Échec création vocal pour ${member.user.tag}:`, err.message || err);
                if (newChannel) {
                    tempVoices.delete(newChannel.id);
                    saveTempVoiceMap(tempVoices);
                    await newChannel.delete().catch(() => {});
                }
            }
        }

        // ===========================
        // QUITTE UN VOCAL TEMPORAIRE → supprime si vide
        // ===========================
        if (oldState.channelId && tempVoices.has(oldState.channelId)) {
            const channel = guild.channels.cache.get(oldState.channelId);
            if (channel && channel.members.size === 0) {
                await channel.delete().catch(() => {});
                tempVoices.delete(oldState.channelId);
                saveTempVoiceMap(tempVoices);
            }
        }
    });
};