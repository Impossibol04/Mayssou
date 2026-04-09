// src/utils/modLog.js
// Utilitaire centralisé pour envoyer les logs de modération.
// Usage : await sendModLog(client, guild, { action, moderator, target, reason, extra })

const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('./guildConfig');

const ACTION_STYLES = {
    ban:      { emoji: '🔨', color: 0xe74c3c, label: 'Ban'      },
    unban:    { emoji: '✅', color: 0x2ecc71, label: 'Unban'    },
    kick:     { emoji: '👢', color: 0xe67e22, label: 'Kick'     },
    warn:     { emoji: '⚠️', color: 0xf1c40f, label: 'Warn'     },
    timeout:  { emoji: '🤐', color: 0x9b59b6, label: 'Timeout'  },
    clear:    { emoji: '🧹', color: 0x3498db, label: 'Clear'    },
    lock:     { emoji: '🔒', color: 0x95a5a6, label: 'Lock'     },
    unlock:   { emoji: '🔓', color: 0x95a5a6, label: 'Unlock'   },
    banlist:  { emoji: '🔨', color: 0xe74c3c, label: 'Mass Ban' },
};

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Guild}  guild
 * @param {object} opts
 * @param {string}  opts.action     — clé dans ACTION_STYLES
 * @param {import('discord.js').User|import('discord.js').GuildMember} opts.moderator
 * @param {import('discord.js').User|import('discord.js').GuildMember|null} opts.target
 * @param {string}  [opts.reason]
 * @param {Array<{name:string,value:string,inline?:boolean}>} [opts.extra]  — champs supplémentaires
 */
async function sendModLog(client, guild, { action, moderator, target = null, reason = null, extra = [] }) {
    const cfg = getGuildConfig(guild.id);
    if (!cfg.modLogsChannel) return; // Pas de salon configuré, on skip silencieusement

    const channel = guild.channels.cache.get(cfg.modLogsChannel);
    if (!channel?.isTextBased()) return;

    const style = ACTION_STYLES[action] ?? { emoji: '🔧', color: 0x7f8c8d, label: action };

    const embed = new EmbedBuilder()
        .setTitle(`${style.emoji} ${style.label}`)
        .setColor(style.color)
        .setTimestamp();

    if (moderator) {
        const modUser = moderator.user ?? moderator;
        embed.addFields({ name: '👮 Modérateur', value: `${modUser.username} (\`${modUser.id}\`)`, inline: true });
    }

    if (target) {
        const targetUser = target.user ?? target;
        embed.addFields({ name: '👤 Cible', value: `${targetUser.username} (\`${targetUser.id}\`)`, inline: true });
    }

    if (reason) {
        embed.addFields({ name: '📝 Raison', value: reason });
    }

    for (const field of extra) {
        embed.addFields(field);
    }

    await channel.send({ embeds: [embed] }).catch(err =>
        console.error('[modLog] Impossible d\'envoyer dans le salon logs :', err.message)
    );
}

module.exports = { sendModLog };