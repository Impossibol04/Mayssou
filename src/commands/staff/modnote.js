const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addNote, listNotes, deleteNote } = require('../../utils/modNotesStore');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
        return message.reply('❌ Il faut **Modérer les membres**.');

    const sub = (args[0] || '').toLowerCase();
    if (!['add', 'list', 'del', 'delete'].includes(sub))
        return message.reply('⚠️ `modnote add @user <texte>` | `modnote list @user` | `modnote del <id>`');

    if (sub === 'add' && args.length < 3)
        return message.reply('⚠️ `modnote add @user <texte>` — texte manquant ou membre manquant.');

    if (sub === 'add') {
        let target = message.mentions.users.first();
        if (!target && args[1] && /^\d{17,20}$/.test(args[1]))
            target = await client.users.fetch(args[1]).catch(() => null);
        const text = args.slice(2).join(' ').trim();
        if (!target || !text) return message.reply('⚠️ `modnote add @user <texte>`');
        const n = addNote(message.guild.id, target.id, message.author.id, text);
        return message.reply(`✅ Note **\`${n.id}\`** ajoutée pour ${target.tag}.`);
    }

    if (sub === 'list') {
        let target = message.mentions.users.first();
        if (!target && args[1] && /^\d{17,20}$/.test(args[1]))
            target = await client.users.fetch(args[1]).catch(() => null);
        if (!target) return message.reply('⚠️ `modnote list @user`');
        const notes = listNotes(message.guild.id, target.id, 12);
        if (!notes.length) return message.reply(`ℹ️ Aucune note pour **${target.tag}**.`);
        const lines = notes.map(
            (n) =>
                `**\`${n.id}\`** <t:${Math.floor(new Date(n.at).getTime() / 1000)}:f>\n${(n.text || '').slice(0, 300)}`
        );
        const embed = new EmbedBuilder()
            .setTitle(`📋 Notes mod — ${target.tag}`)
            .setDescription(lines.join('\n\n').slice(0, 4000))
            .setColor(0x9b59b6);
        return message.channel.send({ embeds: [embed] });
    }

    if (sub === 'del' || sub === 'delete') {
        const id = args[1];
        if (!id) return message.reply('⚠️ `modnote del <id>`');
        const ok = deleteNote(message.guild.id, id);
        return message.reply(ok ? '🗑️ Note supprimée.' : '❌ ID introuvable sur ce serveur.');
    }

    return message.reply('⚠️ Sous-commande inconnue.');
};

module.exports.cooldown = 2;
