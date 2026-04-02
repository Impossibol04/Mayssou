const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig } = require('../utils/guildConfig');
const { loadTempVoiceMap, saveTempVoiceMap } = require('../utils/tempVoiceStore');
const { sendVoiceOwnerPanel } = require('../utils/voiceOwnerPanel');

// Map des vocaux temporaires : channelId → ownerId (persisté sur disque)
const tempVoices = loadTempVoiceMap();

module.exports = (bot) => {
    bot.voiceSessions = bot.voiceSessions || new Map();
    bot.tempVoices = tempVoices;

    bot.once('ready', () => {
        let changed = false;
        for (const channelId of [...tempVoices.keys()]) {
            if (!bot.channels.cache.has(channelId)) {
                tempVoices.delete(channelId);
                changed = true;
            }
        }
        if (changed) saveTempVoiceMap(tempVoices);
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

        // Membre souvent absent du cache (compte peu actif) → fetch obligatoire
        if (!member && userId) {
            try {
                member = await guild.members.fetch({ user: userId, force: true });
            } catch (e) {
                console.error(`[autoVoice] Impossible de charger le membre ${userId} sur ${guild.id}:`, e.message);
                return;
            }
        }
        if (!member || member.user.bot) return;

        // ===========================
        // REJOINT LE SALON HUB → crée un vocal privé
        // ===========================
        if (newState.channelId === hubId) {
            let newChannel = null;
            try {
                const hubChannel =
                    guild.channels.cache.get(hubId) || (await guild.channels.fetch(hubId).catch(() => null));
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

                await sendVoiceOwnerPanel(bot, member, newChannel).catch((e) =>
                    console.error('Panneau propriétaire vocal (MP):', e)
                );
            } catch (err) {
                console.error(
                    `[autoVoice] Échec création/déplacement vocal pour ${member.user.tag} (${member.id}) :`,
                    err.message || err
                );
                if (err.code) console.error('   code Discord:', err.code);

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
