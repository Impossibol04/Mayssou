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
        if (!cfg.joinVoiceChannel) return;

        const guild = newState.guild || oldState.guild;
        const member = newState.member || oldState.member;

        // ===========================
        // REJOINT LE SALON HUB → crée un vocal privé
        // ===========================
        if (newState.channelId === cfg.joinVoiceChannel) {
            try {
                const category = newState.channel?.parent;

                const newChannel = await guild.channels.create({
                    name: `🔊 ${member.user.username}`,
                    type: ChannelType.GuildVoice,
                    parent: category || null,
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
                console.error("Erreur création vocal temporaire:", err);
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
