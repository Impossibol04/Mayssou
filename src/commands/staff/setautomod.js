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
                `Insultes (mots FR, mot entier) : ${s.insults ? 'oui' : 'non'}`,
                `Anti-spam : ${s.spam ? 'oui' : 'non'} — débit **${s.spamMax}** msg / **${s.spamWindowMs / 1000}s**, doublons **${s.spamDupCount}×** le même texte / **${s.spamDupWindowMs / 1000}s**, répétitions **${s.spamRepeatChar}** car. identiques`,
                `Anti-caps : ${s.caps ? 'oui' : 'non'} (≥ **${s.capsMinLen}** car. message, ≥ **${s.capsMinLetters}** lettres, ratio maj. ≥ **${s.capsRatio}**)`,
                `Bloquer invites Discord : ${s.blockInvites ? 'oui' : 'non'}`,
                `Bloquer liens (http(s), www, aperçus) + GIF en fichier : ${s.blockLinks ? `oui${s.blockGifFiles ? ' (GIF fichiers inclus)' : ' (GIF fichiers autorisés)'}` : 'non'}`,
                `Salons ignorés par l’auto-mod : **${s.ignoreChannelIds.length}** (\`ignore list\`)`,
                '',
                `Configure : \`on|off\`, \`insults\`, \`spam\`, \`caps\`, \`invites\`, \`links\`, \`giffiles\`, \`ignore add|remove|list\` — *Gérer serveur.*`,
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

    if (sub === 'ignore' || sub === 'ignorer') {
        const act = (args[1] || '').toLowerCase();
        const cur = getGuildConfig(message.guild.id).autoMod;
        const base = cur && typeof cur === 'object' ? cur : {};
        let list = Array.isArray(base.ignoreChannels) ? [...base.ignoreChannels] : [];
        if (act === 'list' || !act) {
            if (!list.length) return message.reply('ℹ️ Aucun salon ignoré.');
            const lines = list
                .map((id) => {
                    const ch = message.guild.channels.cache.get(id);
                    return ch ? `· ${ch}` : `· \`${id}\` *(introuvable)*`;
                })
                .join('\n');
            return message.reply(`📋 **Salons ignorés (auto-mod)**\n${lines}`);
        }
        const ch =
            message.mentions.channels.first() ||
            (args[2] && message.guild.channels.cache.get(args[2])) ||
            (args[2] && /^\d{17,20}$/.test(args[2]) ? message.guild.channels.cache.get(args[2]) : null);
        if (act === 'add') {
            if (!ch || !ch.isTextBased()) {
                return message.reply(`⚠️ \`${p}setautomod ignore add #salon\` ou ID texte.`);
            }
            if (!list.includes(ch.id)) list.push(ch.id);
            mergeAutoMod(message.guild.id, { ignoreChannels: list });
            return message.reply(`✅ ${ch} ignoré par l’auto-mod.`);
        }
        if (act === 'remove' || act === 'del' || act === 'delete') {
            if (!ch) return message.reply(`⚠️ \`${p}setautomod ignore remove #salon\``);
            list = list.filter((id) => id !== ch.id);
            mergeAutoMod(message.guild.id, { ignoreChannels: list });
            return message.reply(`✅ ${ch} n’est plus ignoré.`);
        }
        return message.reply(`⚠️ \`${p}setautomod ignore add #salon | remove #salon | list\``);
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
    if (sub === 'links' || sub === 'liens' || sub === 'url' || sub === 'urls') {
        mergeAutoMod(message.guild.id, { blockLinks: val });
        return message.reply(
            `✅ Blocage des **liens** (http(s), www, aperçus embed) : **${val ? 'activé' : 'désactivé'}**.` +
                (val ? ` Utilise aussi \`${p}setautomod giffiles off\` pour autoriser les GIF en pièce jointe.` : '')
        );
    }
    if (sub === 'giffiles' || sub === 'giffichiers' || sub === 'gif') {
        mergeAutoMod(message.guild.id, { blockGifFiles: val });
        return message.reply(
            `✅ Blocage des **fichiers GIF** (pièces jointes) avec l’anti-liens : **${val ? 'activé' : 'désactivé'}**.`
        );
    }

    return message.reply(
        `⚠️ Sous-commandes : \`on\` · \`off\` · \`status\` · \`insults\` · \`spam\` · \`caps\` · \`invites\` · \`links\` · \`giffiles\` · \`ignore\` (+ on/off ou salons).`
    );
};
