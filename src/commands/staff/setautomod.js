const { PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setGuildConfigMulti } = require('../../utils/guildConfig');
const { getSettings } = require('../../utils/autoModeration');

function mergeAutoMod(guildId, partial) {
    const cur = getGuildConfig(guildId).autoMod;
    const base = cur && typeof cur === 'object' ? cur : {};
    setGuildConfigMulti(guildId, { autoMod: { ...base, ...partial } });
}

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply("❌ Permission **Gérer le serveur** requise.");
    }

    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (!sub || sub === 'status') {
        const s = getSettings(message.guild.id);
        return message.reply(
            [
                '🤖 **Auto-modération**',
                `État : **${s.enabled ? 'activée' : 'désactivée'}**`,
                `Insultes (liste courte FR) : ${s.insults ? 'oui' : 'non'}`,
                `Anti-spam : ${s.spam ? 'oui' : 'non'} (${s.spamMax} msgs / ${s.spamWindowMs / 1000}s)`,
                `Anti-caps : ${s.caps ? 'oui' : 'non'} (min ${s.capsMinLen} car., ratio ≥ ${s.capsRatio})`,
                `Bloquer invites Discord : ${s.blockInvites ? 'oui' : 'non'}`,
                '',
                `Configure avec \`${p}setautomod on|off\`, \`insults on|off\`, \`spam on|off\`, \`caps on|off\`, \`invites on|off\``,
            ].join('\n')
        );
    }

    if (sub === 'on' || sub === 'enable') {
        mergeAutoMod(message.guild.id, { enabled: true });
        return message.reply('✅ Auto-mod **activée** (vérifie les sous-options avec `setautomod status`).');
    }
    if (sub === 'off' || sub === 'disable') {
        mergeAutoMod(message.guild.id, { enabled: false });
        return message.reply('✅ Auto-mod **désactivée**.');
    }

    const boolArg = (args[1] || '').toLowerCase();
    const on = boolArg === 'on' || boolArg === 'oui' || boolArg === 'true' || boolArg === '1';
    const off = boolArg === 'off' || boolArg === 'non' || boolArg === 'false' || boolArg === '0';
    if (!on && !off) {
        return message.reply(`⚠️ Précise **on** ou **off** après la sous-commande. Ex. \`${p}setautomod spam off\``);
    }
    const val = on;

    if (sub === 'insults' || sub === 'insultes') {
        mergeAutoMod(message.guild.id, { insults: val });
        return message.reply(`✅ Filtre insultes : **${val ? 'activé' : 'désactivé'}**.`);
    }
    if (sub === 'spam') {
        mergeAutoMod(message.guild.id, { spam: val });
        return message.reply(`✅ Anti-spam : **${val ? 'activé' : 'désactivé'}**.`);
    }
    if (sub === 'caps') {
        mergeAutoMod(message.guild.id, { caps: val });
        return message.reply(`✅ Anti-caps : **${val ? 'activé' : 'désactivé'}**.`);
    }
    if (sub === 'invites' || sub === 'invite') {
        mergeAutoMod(message.guild.id, { blockInvites: val });
        return message.reply(`✅ Blocage des liens d’invitation Discord : **${val ? 'activé' : 'désactivé'}**.`);
    }

    return message.reply(
        `⚠️ Sous-commandes : \`on\` · \`off\` · \`status\` · \`insults\` · \`spam\` · \`caps\` · \`invites\` (+ on/off).`
    );
};
