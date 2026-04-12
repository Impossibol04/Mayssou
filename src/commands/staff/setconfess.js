const { PermissionFlagsBits } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply("❌ Tu n'as pas la permission de configurer le bot.");

    const p = (process.env.prefix || '+').trim() || '+';
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'input' || sub === 'in') {
        const ch =
            message.mentions.channels.first() ||
            (args[1] ? message.guild.channels.cache.get(args[1]) : null) ||
            message.channel;
        setGuildConfig(message.guild.id, 'confessInputChannel', ch.id);
        return message.reply(`✅ Salon **saisie** des confessions : ${ch}\nLes membres n’utilisent \`+confess\` **que** là.`);
    }

    if (sub === 'output' || sub === 'out' || sub === 'public') {
        const ch =
            message.mentions.channels.first() ||
            (args[1] ? message.guild.channels.cache.get(args[1]) : null) ||
            message.channel;
        setGuildConfig(message.guild.id, 'confessChannel', ch.id);
        return message.reply(`✅ Salon **publication** des confessions : ${ch}`);
    }

    if (sub === 'show' || sub === 'status') {
        const c = getGuildConfig(message.guild.id);
        const pub = c.confessChannel ? `<#${c.confessChannel}>` : '—';
        const inp = c.confessInputChannel ? `<#${c.confessInputChannel}>` : pub;
        return message.reply(`🤫 **Confessions**\nSaisie : ${inp}\nPublication : ${pub}`);
    }

    const mentioned = [...message.mentions.channels.values()];
    if (mentioned.length >= 2) {
        const [inputCh, outputCh] = mentioned;
        setGuildConfig(message.guild.id, 'confessInputChannel', inputCh.id);
        setGuildConfig(message.guild.id, 'confessChannel', outputCh.id);
        return message.reply(
            `✅ Saisie : ${inputCh}\n✅ Publication : ${outputCh}\nLes confessions sont **anonymes** dans le salon public.`
        );
    }

    const ch1 =
        message.mentions.channels.first() || (args[0] ? message.guild.channels.cache.get(args[0]) : null) || message.channel;

    setGuildConfig(message.guild.id, 'confessChannel', ch1.id);
    setGuildConfig(message.guild.id, 'confessInputChannel', ch1.id);

    return message.reply(
        [
            `✅ Tout est sur ${ch1} (saisie + publication).`,
            `Pour séparer : \`${p}setconfess #saisie #public\` ou \`${p}setconfess input #…\` / \`output #…\`.`,
        ].join('\n')
    );
};
