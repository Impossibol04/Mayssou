const { PermissionFlagsBits, GuildVerificationLevel } = require('discord.js');
const { sendModLog } = require('../utils/modlogs');
const {
    getAntiraidSettings,
    isRaidActive,
    markRaid,
    pruneJoins,
    recordJoin,
    clearJoins,
    cancelVerifyRestore,
    scheduleVerifyRestore,
} = require('../utils/antiraid');

module.exports = (bot) => {
    bot.on('guildMemberAdd', async (member) => {
        const guild = member.guild;
        const settings = getAntiraidSettings(guild.id);
        if (!settings.enabled) return;

        const windowMs = settings.windowSec * 1000;
        pruneJoins(guild.id, windowMs);
        const count = recordJoin(guild.id);

        const me = guild.members.me;
        if (!me?.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

        if (count >= settings.threshold) {
            clearJoins(guild.id);
            const raidMs = settings.raidDurationSec * 1000;
            const until = markRaid(guild.id, raidMs);

            await sendModLog(bot, guild, {
                action: 'antiraid',
                moderator: bot.user,
                target: member.user,
                reason: 'Pic d’arrivées détecté',
                extra: [
                    { name: 'Arrivées', value: `${count} en ${settings.windowSec}s (seuil ${settings.threshold})`, inline: false },
                    { name: 'Mode raid jusqu’à', value: `<t:${Math.floor(until / 1000)}:R>`, inline: true },
                ],
            }).catch(() => {});

            if (settings.verifyBump && me.permissions.has(PermissionFlagsBits.ManageGuild)) {
                try {
                    const current = guild.verificationLevel;
                    if (current !== GuildVerificationLevel.VeryHigh) {
                        cancelVerifyRestore(guild.id);
                        await guild.setVerificationLevel(GuildVerificationLevel.VeryHigh, 'Antiraid');
                        scheduleVerifyRestore(guild, current, raidMs);
                    }
                } catch (e) {
                    console.error('[antiraid] verify bump:', e.message);
                }
            }
        }

        if (!isRaidActive(guild.id) || !settings.strictNewAccounts) return;

        const maxAgeMs = settings.newAccountMaxAgeDays * 24 * 60 * 60 * 1000;
        if (Date.now() - member.user.createdTimestamp < maxAgeMs) {
            try {
                await member.timeout(
                    10 * 60 * 1000,
                    `Antiraid : compte récent (< ${settings.newAccountMaxAgeDays}j)`
                );
                await sendModLog(bot, guild, {
                    action: 'timeout',
                    moderator: bot.user,
                    target: member.user,
                    reason: `Antiraid strict — compte trop récent`,
                });
            } catch (e) {
                console.error('[antiraid] strict timeout:', e.message);
            }
        }
    });
};
