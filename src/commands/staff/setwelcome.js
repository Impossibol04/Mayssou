const { PermissionFlagsBits } = require('discord.js');
const { setGuildConfig, deleteGuildConfigKey } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply("❌ Tu n'as pas la permission de configurer le bot.");

    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (sub === 'join') {
        const channel = message.mentions.channels.first()
            || (args[1] ? message.guild.channels.cache.get(args[1]) : null)
            || message.channel;
        setGuildConfig(message.guild.id, 'welcomeChannel', channel.id);
        return message.reply(`✅ Les messages d'arrivée seront envoyés dans ${channel}.`);
    }

    if (sub === 'leave') {
        const channel = message.mentions.channels.first()
            || (args[1] ? message.guild.channels.cache.get(args[1]) : null)
            || message.channel;
        setGuildConfig(message.guild.id, 'leaveChannel', channel.id);
        return message.reply(`✅ Les messages de départ seront envoyés dans ${channel}.`);
    }

    if (sub === 'joinmessage' || sub === 'jointext') {
        const text = args.slice(1).join(' ').trim();
        if (!text) {
            return message.reply(
                [
                    '⚠️ Donne le texte du message d’arrivée.',
                    'Variables : `{mention}` `{user}` `{tag}` `{server}` `{count}`',
                    `Ex. : \`${p}setwelcome joinmessage Bienvenue {mention} sur **{server}** — nous sommes {count} !\``,
                    `Réinitialise avec \`${p}setwelcome joinmessage reset\` (embed par défaut).`,
                ].join('\n')
            );
        }
        if (text.toLowerCase() === 'reset') {
            deleteGuildConfigKey(message.guild.id, 'welcomeTemplate');
            return message.reply('✅ Message d’arrivée remis sur **l’embed par défaut**.');
        }
        setGuildConfig(message.guild.id, 'welcomeTemplate', text);
        return message.reply('✅ **Message d’arrivée** personnalisé enregistré.');
    }

    if (sub === 'leavemessage' || sub === 'leavetext') {
        const text = args.slice(1).join(' ').trim();
        if (!text) {
            return message.reply(
                [
                    '⚠️ Texte du message de départ.',
                    'Variables : `{user}` `{tag}` `{server}` `{count}` (`{mention}` rarement utile)',
                    `Ex. : \`${p}setwelcome leavemessage {user} nous a quitté — reste {count} sur {server}.\``,
                    `Reset : \`${p}setwelcome leavemessage reset\``,
                ].join('\n')
            );
        }
        if (text.toLowerCase() === 'reset') {
            deleteGuildConfigKey(message.guild.id, 'leaveTemplate');
            return message.reply('✅ Message de départ remis sur **l’embed par défaut**.');
        }
        setGuildConfig(message.guild.id, 'leaveTemplate', text);
        return message.reply('✅ **Message de départ** enregistré.');
    }

    return message.reply([
        '⚠️ **setwelcome**',
        `\`${p}setwelcome join #salon\` — salon des arrivées`,
        `\`${p}setwelcome leave #salon\` — salon des départs`,
        `\`${p}setwelcome joinmessage <texte>\` — message texte (ou \`reset\`)`,
        `\`${p}setwelcome leavemessage <texte>\` — idem départs`,
    ].join('\n'));
};
