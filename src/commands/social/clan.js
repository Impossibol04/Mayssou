const {
    normalizeTag,
    getClan,
    setClan,
    deleteClan,
    userClanTag,
} = require('../../utils/clanStore');

module.exports = async (client, message, args) => {
    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';
    const gid = message.guild.id;
    const uid = message.author.id;

    if (!sub || sub === 'help') {
        return message.reply(
            [
                '🏰 **Guildes / clans**',
                `\`${p}clan create <TAG> [nom]\` — crée (TAG 2–8 car. alphanum.)`,
                `\`${p}clan join <TAG>\` — rejoindre`,
                `\`${p}clan leave\` — quitter`,
                `\`${p}clan info [TAG]\` — fiche`,
                `\`${p}clan kick @membre\` — chef uniquement`,
                `\`${p}clan disband\` — supprimer ta guilde`,
            ].join('\n')
        );
    }

    if (sub === 'create') {
        const tag = normalizeTag(args[1]);
        const name = args.slice(2).join(' ').trim() || tag;
        if (tag.length < 2 || tag.length > 8) {
            return message.reply('⚠️ Le tag doit faire **2 à 8** caractères (lettres/chiffres).');
        }
        if (getClan(gid, tag)) return message.reply('❌ Ce tag existe déjà.');
        if (userClanTag(gid, uid)) return message.reply('❌ Tu es déjà dans une guilde. Quitte-la avant.');

        setClan(gid, tag, { name: name.slice(0, 80), ownerId: uid, members: [] });
        return message.reply(`✅ Guilde **${tag}** créée ! (${name})`);
    }

    if (sub === 'join') {
        const tag = normalizeTag(args[1]);
        const c = getClan(gid, tag);
        if (!c) return message.reply('❌ Guilde introuvable.');
        if (userClanTag(gid, uid)) return message.reply('❌ Tu es déjà dans une guilde.');
        if (c.ownerId === uid) return message.reply('ℹ️ Tu es déjà le chef.');
        if ((c.members || []).includes(uid)) return message.reply('ℹ️ Tu es déjà membre.');
        c.members = c.members || [];
        if (c.members.length >= 49) return message.reply('❌ Guilde pleine (max 50 avec le chef).');
        c.members.push(uid);
        setClan(gid, tag, c);
        return message.reply(`✅ Bienvenue dans **${tag}** !`);
    }

    if (sub === 'leave') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('ℹ️ Tu n’es dans aucune guilde.');
        const c = getClan(gid, cur);
        if (c.ownerId === uid) {
            return message.reply('❌ Transfère le lead ou fais `clan disband`.');
        }
        c.members = (c.members || []).filter((id) => id !== uid);
        setClan(gid, cur, c);
        return message.reply(`✅ Tu as quitté **${cur}**.`);
    }

    if (sub === 'disband') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('ℹ️ Tu n’es dans aucune guilde.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef peut dissoudre.');
        deleteClan(gid, cur);
        return message.reply(`✅ Guilde **${cur}** dissoute.`);
    }

    if (sub === 'kick') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('❌ Tu n’es pas dans une guilde.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef peut expulser.');
        const target = message.mentions.members?.first();
        if (!target) return message.reply(`⚠️ \`${p}clan kick @membre\``);
        c.members = (c.members || []).filter((id) => id !== target.id);
        setClan(gid, cur, c);
        return message.reply(`✅ ${target} retiré de **${cur}**.`);
    }

    if (sub === 'info') {
        const tag = args[1] ? normalizeTag(args[1]) : userClanTag(gid, uid);
        if (!tag) return message.reply('⚠️ Précise un TAG ou rejoins une guilde.');
        const c = getClan(gid, tag);
        if (!c) return message.reply('❌ Guilde introuvable.');
        const owner = await client.users.fetch(c.ownerId).catch(() => null);
        const memLines = await Promise.all(
            (c.members || []).slice(0, 15).map(async (id) => {
                const u = await client.users.fetch(id).catch(() => null);
                return u ? `· ${u.tag}` : `· ${id}`;
            })
        );
        const more = (c.members || []).length > 15 ? `\n… +${(c.members || []).length - 15}` : '';
        return message.reply(
            [
                `🏰 **${tag}** — ${c.name}`,
                `Chef : ${owner ? owner.tag : c.ownerId}`,
                `Membres (${(c.members || []).length}) :`,
                memLines.join('\n') + more,
            ].join('\n')
        );
    }

    return message.reply(`⚠️ \`${p}clan help\``);
};
