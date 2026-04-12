const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { canListGuildInvites } = require('../../utils/commandGuards');

module.exports = async (client, message) => {
    if (!canListGuildInvites(message.member)) {
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Permission')
            .setDescription('Il faut **Gérer le serveur** pour voir les statistiques d’invitations.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const guild = message.guild;
    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Bot')
            .setDescription('Le bot doit avoir **Gérer le serveur** pour lire la liste des invitations.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const loading = await message.reply({
        embeds: [
            new EmbedBuilder()
                .setColor(0x5865f2)
                .setDescription('📨 **Chargement des invitations…**'),
        ],
    });

    let invites;
    try {
        invites = await guild.invites.fetch();
    } catch (err) {
        console.error('[inviteinfo]', err);
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Erreur')
            .setDescription('Impossible de récupérer les invitations (rate limit ou droits).')
            .setTimestamp();
        return loading.edit({ embeds: [e] }).catch(() => message.channel.send({ embeds: [e] }));
    }

    const list = [...invites.values()];
    let totalUses = 0;
    const byInviter = new Map();

    for (const inv of list) {
        const u = inv.uses || 0;
        totalUses += u;
        const id = inv.inviter?.id || '0';
        const cur = byInviter.get(id) || { uses: 0, links: 0 };
        cur.uses += u;
        cur.links += 1;
        byInviter.set(id, cur);
    }

    const sortedInviters = [...byInviter.entries()]
        .filter(([id]) => id !== '0')
        .sort((a, b) => b[1].uses - a[1].uses)
        .slice(0, 12);

    const unknownUses = byInviter.get('0')?.uses || 0;
    const unknownLinks = byInviter.get('0')?.links || 0;

    let vanityLine = '—';
    let vanityUses = null;
    try {
        const vanity = await guild.fetchVanityData().catch(() => null);
        if (vanity?.code) {
            vanityLine = `discord.gg/${vanity.code}`;
            vanityUses = vanity.uses ?? 0;
        }
    } catch (_) {}

    const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 64 }) || undefined })
        .setTitle('📨 Invitations du serveur')
        .setThumbnail(guild.iconURL({ size: 256 }) || null)
        .addFields(
            {
                name: 'Résumé',
                value:
                    `**${list.length}** lien(s) d’invitation actif(s)\n` +
                    `**${totalUses}** entrée(s) comptabilisée(s) (somme des *uses*)`,
                inline: false,
            },
            {
                name: 'URL personnalisée (vanity)',
                value:
                    vanityUses != null
                        ? `**${vanityLine}**\n**${vanityUses}** utilisation(s) (compteur Discord)`
                        : vanityLine,
                inline: false,
            }
        )
        .setFooter({ text: 'Les compteurs par lien peuvent différer du nombre réel de membres' })
        .setTimestamp();

    if (sortedInviters.length > 0) {
        const lines = await Promise.all(
            sortedInviters.map(async ([id, { uses, links }], i) => {
                const u = await client.users.fetch(id).catch(() => null);
                const name = u ? u.tag : `\`${id}\``;
                return `**${i + 1}.** ${name} — **${uses}** use(s) · ${links} lien(s)`;
            })
        );
        embed.addFields({
            name: 'Top par créateur (uses cumulées)',
            value: lines.join('\n').slice(0, 1024) || '—',
            inline: false,
        });
    } else if (list.length > 0) {
        embed.addFields({
            name: 'Créateurs',
            value:
                unknownLinks > 0
                    ? `Certaines invitations n’ont pas d’auteur connu (**${unknownUses}** use(s)).`
                    : 'Répartition par membre non disponible.',
            inline: false,
        });
    }

    if (list.length === 0) {
        embed.setDescription('*Aucune invitation classique en cache — vérifie les paramètres du serveur ou crée une invite.*');
    }

    await loading.edit({ embeds: [embed] }).catch(() => message.channel.send({ embeds: [embed] }));
};
