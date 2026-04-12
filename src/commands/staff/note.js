const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addNote, listNotes, deleteNote } = require('../../utils/modNotesStore');
const theme = require('../../utils/embedTheme');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Permission **Modérer les membres** requise.')],
        });
    }

    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (!['add', 'list', 'del', 'delete'].includes(sub)) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.WARN)
                    .setTitle('📌 Notes staff (membre)')
                    .setDescription(
                        `**Ajouter** — \`${p}note add @membre <texte>\`\n**Lister** — \`${p}note list @membre\`\n**Supprimer** — \`${p}note del <id>\``
                    ),
            ],
        });
    }

    if (sub === 'add') {
        if (args.length < 3) {
            return message.reply({
                embeds: [
                    new EmbedBuilder().setColor(theme.WARN).setDescription(`⚠️ \`${p}note add @membre <texte>\` — texte ou membre manquant.`),
                ],
            });
        }
        let target = message.mentions.users.first();
        if (!target && args[1] && /^\d{17,20}$/.test(args[1])) target = await client.users.fetch(args[1]).catch(() => null);
        const text = args.slice(2).join(' ').trim();
        if (!target || !text) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription(`⚠️ \`${p}note add @membre <texte>\``)],
            });
        }
        if (text.length > 900) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Texte trop long (max **900** caractères).')],
            });
        }
        const n = addNote(message.guild.id, target.id, message.author.id, text);
        const embed = new EmbedBuilder()
            .setColor(theme.SUCCESS)
            .setTitle('✅ Note enregistrée')
            .setDescription(`Membre : **${target.tag}**\nID note : \`${n.id}\``)
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    if (sub === 'list') {
        let target = message.mentions.users.first();
        if (!target && args[1] && /^\d{17,20}$/.test(args[1])) target = await client.users.fetch(args[1]).catch(() => null);
        if (!target) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription(`⚠️ \`${p}note list @membre\``)],
            });
        }
        const notes = listNotes(message.guild.id, target.id, 12);
        if (!notes.length) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(theme.INFO).setDescription(`ℹ️ Aucune note pour **${target.tag}**.`)],
            });
        }
        const lines = notes.map(
            (n) =>
                `**\`${n.id}\`** · <t:${Math.floor(new Date(n.at).getTime() / 1000)}:f>\n${(n.text || '').slice(0, 350)}${(n.text || '').length > 350 ? '…' : ''}`
        );
        const embed = new EmbedBuilder()
            .setTitle(`📋 Notes — ${target.tag}`)
            .setDescription(lines.join('\n\n').slice(0, 4000))
            .setColor(theme.MOD)
            .setFooter({ text: 'Visible staff uniquement dans ce salon.' });
        return message.reply({ embeds: [embed] });
    }

    if (sub === 'del' || sub === 'delete') {
        const id = args[1];
        if (!id) {
            return message.reply({
                embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription(`⚠️ \`${p}note del <id>\``)],
            });
        }
        const ok = deleteNote(message.guild.id, id);
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(ok ? theme.SUCCESS : theme.ERROR)
                    .setDescription(ok ? '🗑️ Note supprimée.' : '❌ ID introuvable sur ce serveur.'),
            ],
        });
    }
};

module.exports.cooldown = 2;
