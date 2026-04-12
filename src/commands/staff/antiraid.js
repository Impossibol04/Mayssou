const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getAntiraidSettings, saveAntiraidSettings, isRaidActive, raidUntil } = require('../../utils/antiraid');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator))
        return message.reply('❌ Réservé aux **administrateurs**.');

    const sub = (args[0] || '').toLowerCase();
    const s = getAntiraidSettings(message.guild.id);

    if (!sub || sub === 'status') {
        const embed = new EmbedBuilder()
            .setTitle('🛡️ Antiraid')
            .setColor(0xe74c3c)
            .addFields(
                { name: 'État', value: s.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
                { name: 'Seuil', value: `${s.threshold} joins / ${s.windowSec}s`, inline: true },
                { name: 'Mode raid', value: isRaidActive(message.guild.id) ? `actif <t:${Math.floor((raidUntil.get(message.guild.id) || 0) / 1000)}:R>` : 'non', inline: true },
                { name: 'Montée niveau vérif.', value: s.verifyBump ? 'Oui (Very High le temps du raid)' : 'Non', inline: true },
                {
                    name: 'Strict comptes récents',
                    value: s.strictNewAccounts
                        ? `Oui — timeout 10 min si compte < **${s.newAccountMaxAgeDays}** jour(s)`
                        : 'Non',
                    inline: false,
                },
                { name: 'Durée mode raid', value: `${s.raidDurationSec}s`, inline: true }
            )
            .setFooter({ text: 'Configure avec : enable | disable | threshold | window | verify | strict | raidlen' });
        return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'enable' || sub === 'on') {
        saveAntiraidSettings(message.guild.id, { enabled: true });
        return message.reply('✅ Antiraid **activé**. Pense à configurer `setmodlogs` pour les alertes.');
    }
    if (sub === 'disable' || sub === 'off') {
        saveAntiraidSettings(message.guild.id, { enabled: false });
        return message.reply('✅ Antiraid **désactivé**.');
    }

    if (sub === 'threshold') {
        const n = parseInt(args[1], 10);
        if (isNaN(n) || n < 3 || n > 100) return message.reply('⚠️ Utilisation : `antiraid threshold <3-100>`');
        saveAntiraidSettings(message.guild.id, { threshold: n });
        return message.reply(`✅ Seuil fixé à **${n}** arrivées dans la fenêtre.`);
    }

    if (sub === 'window') {
        const n = parseInt(args[1], 10);
        if (isNaN(n) || n < 5 || n > 120) return message.reply('⚠️ Utilisation : `antiraid window <secondes 5-120>`');
        saveAntiraidSettings(message.guild.id, { windowSec: n });
        return message.reply(`✅ Fenêtre : **${n}s**.`);
    }

    if (sub === 'verify') {
        const v = (args[1] || '').toLowerCase();
        if (!['on', 'off', 'oui', 'non', '1', '0', 'true', 'false'].includes(v))
            return message.reply('⚠️ `antiraid verify on|off`');
        const on = ['on', 'oui', '1', 'true'].includes(v);
        saveAntiraidSettings(message.guild.id, { verifyBump: on });
        return message.reply(`✅ Montée automatique du niveau de vérification : **${on ? 'activée' : 'désactivée'}**.`);
    }

    if (sub === 'strict') {
        const v = (args[1] || '').toLowerCase();
        if (!['on', 'off', 'oui', 'non', '1', '0', 'true', 'false'].includes(v))
            return message.reply('⚠️ `antiraid strict on|off` — pendant le mode raid, timeout 10 min des comptes « récents ».');
        const on = ['on', 'oui', '1', 'true'].includes(v);
        saveAntiraidSettings(message.guild.id, { strictNewAccounts: on });
        return message.reply(`✅ Mode strict (comptes récents) : **${on ? 'activé' : 'désactivé'}**.`);
    }

    if (sub === 'agedays' || sub === 'age') {
        const n = parseInt(args[1], 10);
        if (isNaN(n) || n < 1 || n > 30) return message.reply('⚠️ `antiraid agedays <1-30>` — âge max du compte pour le strict.');
        saveAntiraidSettings(message.guild.id, { newAccountMaxAgeDays: n });
        return message.reply(`✅ Comptes considérés comme récents : moins de **${n}** jour(s).`);
    }

    if (sub === 'raidlen' || sub === 'duration') {
        const n = parseInt(args[1], 10);
        if (isNaN(n) || n < 120 || n > 3600) return message.reply('⚠️ `antiraid raidlen <120-3600>` — durée du mode raid en secondes.');
        saveAntiraidSettings(message.guild.id, { raidDurationSec: n });
        return message.reply(`✅ Durée du mode raid : **${n}s**.`);
    }

    return message.reply(
        '⚠️ Sous-commandes : `status`, `on`, `off`, `threshold`, `window`, `verify`, `strict`, `agedays`, `raidlen`.'
    );
};
