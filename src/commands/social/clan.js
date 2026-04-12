const { PermissionFlagsBits } = require('discord.js');
const {
    normalizeTag,
    getClan,
    setClan,
    deleteClan,
    userClanTag,
    clanLevelFromXp,
    xpTotalForClanLevel,
    getWars,
    warKey,
    listClansSorted,
    setWarEntry,
    removeWarEntry,
} = require('../../utils/clanStore');

const MAX_MEMBERS = 49;
const MAX_RIVALS = 8;
const ROLE_NAME_MAX = 100;

function roleNameForClan(tag, name) {
    const base = `[${tag}] ${name || tag}`.trim();
    return base.slice(0, ROLE_NAME_MAX);
}

async function createClanRole(guild, tag, displayName) {
    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) return null;
    return guild.roles.create({
        name: roleNameForClan(tag, displayName),
        mentionable: false,
        reason: 'Clan — création',
    });
}

async function syncRoleName(guild, roleId, tag, displayName) {
    const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
    if (!role) return;
    const next = roleNameForClan(tag, displayName);
    if (role.name !== next && guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        await role.setName(next, 'Clan — renommage').catch(() => {});
    }
}

async function giveClanRole(guild, userId, roleId) {
    if (!roleId) return;
    const m = await guild.members.fetch(userId).catch(() => null);
    if (!m) return;
    await m.roles.add(roleId).catch(() => {});
}

async function takeClanRole(guild, userId, roleId) {
    if (!roleId) return;
    const m = await guild.members.fetch(userId).catch(() => null);
    if (!m) return;
    await m.roles.remove(roleId).catch(() => {});
}

function findWarInvolving(guildId, tag) {
    const t = normalizeTag(tag);
    const wars = getWars(guildId);
    for (const [key, w] of Object.entries(wars)) {
        if (!w) continue;
        if (normalizeTag(w.tag1) === t || normalizeTag(w.tag2) === t) return { key, ...w };
    }
    return null;
}

module.exports = async (client, message, args) => {
    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';
    const gid = message.guild.id;
    const uid = message.author.id;

    const helpLines = [
        '🏰 **Système de clans**',
        `\`${p}clan create <TAG> [nom]\` — crée + **rôle** \`[TAG] nom\``,
        `\`${p}clan join <TAG>\` — rejoindre`,
        `\`${p}clan leave\` — quitter`,
        `\`${p}clan info\` — **liste** des clans · \`${p}clan info <TAG>\` — détail`,
        `\`${p}clan top\` — classement XP / niveau`,
        `\`${p}clan rename <nom>\` — chef · renommer`,
        `\`${p}clan syncrole\` — chef · recrée le rôle si supprimé`,
        `\`${p}clan transfer @membre\` — chef · transfert`,
        `\`${p}clan rival add|remove <TAG> | rival list\` — rivalités (chef)`,
        `\`${p}clan war challenge <TAG>\` · \`war accept <TAG>\` · \`war cancel\` · \`war surrender\` · \`war status\``,
        `\`${p}clan kick @membre\` · \`${p}clan disband\``,
    ];

    if (!sub || sub === 'help') {
        return message.reply(helpLines.join('\n'));
    }

    /** -------- create -------- */
    if (sub === 'create') {
        const tag = normalizeTag(args[1]);
        const name = args.slice(2).join(' ').trim() || tag;
        if (tag.length < 2 || tag.length > 8) {
            return message.reply('⚠️ Le tag doit faire **2 à 8** caractères (lettres/chiffres).');
        }
        if (getClan(gid, tag)) return message.reply('❌ Ce tag existe déjà.');
        if (userClanTag(gid, uid)) return message.reply('❌ Tu es déjà dans un clan. Quitte-le avant.');

        const role = await createClanRole(message.guild, tag, name.slice(0, 80));
        setClan(gid, tag, {
            name: name.slice(0, 80),
            ownerId: uid,
            members: [],
            xp: 0,
            rivals: [],
            roleId: role?.id ?? null,
            challengeTo: null,
        });
        if (role) await giveClanRole(message.guild, uid, role.id);
        const extra = role ? '' : '\n⚠️ Impossible de créer le rôle (permission **Gérer les rôles** manquante pour le bot).';
        return message.reply(`✅ Clan **${tag}** créé !${role ? ` Rôle : ${role}` : ''}${extra}`);
    }

    /** -------- join -------- */
    if (sub === 'join') {
        const tag = normalizeTag(args[1]);
        const c = getClan(gid, tag);
        if (!c) return message.reply('❌ Clan introuvable.');
        if (userClanTag(gid, uid)) return message.reply('❌ Tu es déjà dans un clan.');
        if (c.ownerId === uid) return message.reply('ℹ️ Tu es déjà le chef.');
        if ((c.members || []).includes(uid)) return message.reply('ℹ️ Tu es déjà membre.');
        c.members = c.members || [];
        if (c.members.length >= MAX_MEMBERS) return message.reply(`❌ Clan plein (max ${MAX_MEMBERS + 1} avec le chef).`);
        c.members.push(uid);
        setClan(gid, tag, c);
        await giveClanRole(message.guild, uid, c.roleId);
        return message.reply(`✅ Bienvenue dans **[${tag}]** !`);
    }

    /** -------- leave -------- */
    if (sub === 'leave') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('ℹ️ Tu n’es dans aucun clan.');
        const c = getClan(gid, cur);
        if (c.ownerId === uid) {
            return message.reply('❌ Transfère le lead (`clan transfer`) ou dissous (`clan disband`).');
        }
        c.members = (c.members || []).filter((id) => id !== uid);
        setClan(gid, cur, c);
        await takeClanRole(message.guild, uid, c.roleId);
        return message.reply(`✅ Tu as quitté **[${cur}]**.`);
    }

    /** -------- disband -------- */
    if (sub === 'disband') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('ℹ️ Tu n’es dans aucun clan.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef peut dissoudre.');

        const ids = [c.ownerId, ...(c.members || [])];
        if (c.roleId) {
            const role = message.guild.roles.cache.get(c.roleId);
            if (role && message.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
                await role.delete('Clan dissous').catch(() => {});
            }
        }
        for (const id of ids) await takeClanRole(message.guild, id, c.roleId);
        deleteClan(gid, cur);
        return message.reply(`✅ Clan **${cur}** dissous.`);
    }

    /** -------- kick -------- */
    if (sub === 'kick') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('❌ Tu n’es pas dans un clan.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef peut expulser.');
        let target = message.mentions.members?.first();
        if (!target && args[1]) target = await message.guild.members.fetch(args[1]).catch(() => null);
        if (!target) return message.reply(`⚠️ \`${p}clan kick @membre\``);
        if (target.id === uid) return message.reply('❌ …');
        if (c.ownerId === target.id) return message.reply('❌ Impossible.');
        c.members = (c.members || []).filter((id) => id !== target.id);
        setClan(gid, cur, c);
        await takeClanRole(message.guild, target.id, c.roleId);
        return message.reply(`✅ ${target} retiré de **[${cur}]**.`);
    }

    /** -------- top -------- */
    if (sub === 'top' || sub === 'leaderboard' || sub === 'lb') {
        const rows = listClansSorted(gid);
        if (!rows.length) return message.reply('ℹ️ Aucun clan sur ce serveur.');
        const lines = rows.slice(0, 15).map((r, i) => {
            return `**${i + 1}.** \`[${r.tag}]\` ${r.name} — nv. **${r.level}** · ${r.xp} XP · ${r.members} membres`;
        });
        return message.reply(['🏆 **Clans (XP)**', ...lines].join('\n'));
    }

    /** -------- rename -------- */
    if (sub === 'rename') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('❌ Tu n’es dans aucun clan.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef peut renommer.');
        const name = args.slice(1).join(' ').trim();
        if (!name) return message.reply(`⚠️ \`${p}clan rename <nouveau nom>\``);
        c.name = name.slice(0, 80);
        setClan(gid, cur, c);
        await syncRoleName(message.guild, c.roleId, cur, c.name);
        return message.reply(`✅ Nom du clan : **${c.name}**`);
    }

    /** -------- syncrole -------- */
    if (sub === 'syncrole' || sub === 'role') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('❌ Tu n’es dans aucun clan.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef.');
        let role = c.roleId ? message.guild.roles.cache.get(c.roleId) : null;
        if (!role && c.roleId) role = await message.guild.roles.fetch(c.roleId).catch(() => null);
        if (role) {
            await syncRoleName(message.guild, c.roleId, cur, c.name);
            return message.reply(`✅ Rôle OK : ${role}`);
        }
        const created = await createClanRole(message.guild, cur, c.name);
        if (!created) return message.reply('❌ Permission **Gérer les rôles** requise pour le bot.');
        c.roleId = created.id;
        setClan(gid, cur, c);
        const ids = [c.ownerId, ...(c.members || [])];
        for (const id of ids) await giveClanRole(message.guild, id, created.id);
        return message.reply(`✅ Rôle recréé : ${created} — attribué à tous les membres.`);
    }

    /** -------- transfer -------- */
    if (sub === 'transfer') {
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('❌ Tu n’es dans aucun clan.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef peut transférer.');
        let target = message.mentions.members?.first();
        if (!target && args[1]) target = await message.guild.members.fetch(args[1]).catch(() => null);
        if (!target) return message.reply(`⚠️ \`${p}clan transfer @membre\``);
        if (target.id === uid) return message.reply('❌ …');
        if (target.id !== c.ownerId && !(c.members || []).includes(target.id)) {
            return message.reply('❌ Ce membre doit être dans le clan.');
        }
        const oldOwner = c.ownerId;
        const newOwner = target.id;
        c.members = (c.members || []).filter((id) => id !== newOwner);
        if (oldOwner !== newOwner) c.members.push(oldOwner);
        c.ownerId = newOwner;
        setClan(gid, cur, c);
        return message.reply(`✅ **${target.user.tag}** est le nouveau chef de **[${cur}]**.`);
    }

    /** -------- rival -------- */
    if (sub === 'rival') {
        const act = (args[1] || '').toLowerCase();
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('❌ Tu n’es dans aucun clan.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef gère les rivalités.');

        if (act === 'list' || !act) {
            const riv = (c.rivals || []).map((t) => `\`[${normalizeTag(t)}]\``);
            return message.reply(
                riv.length ? `⚔️ Rivaux de **[${cur}]** : ${riv.join(', ')}` : `ℹ️ Aucun rival déclaré pour **[${cur}]**.`
            );
        }

        const otag = normalizeTag(args[2]);
        if (!otag) return message.reply(`⚠️ \`${p}clan rival add <TAG>\` ou \`remove <TAG>\``);
        if (otag === cur) return message.reply('❌ …');

        const other = getClan(gid, otag);
        if (!other) return message.reply('❌ Clan cible introuvable.');

        if (act === 'add') {
            if ((c.rivals || []).some((x) => normalizeTag(x) === otag)) {
                return message.reply('ℹ️ Rival déjà enregistré.');
            }
            if ((c.rivals || []).length >= MAX_RIVALS) return message.reply(`❌ Max **${MAX_RIVALS}** rivaux.`);
            const oRiv = other.rivals || [];
            if (oRiv.length >= MAX_RIVALS && !oRiv.some((x) => normalizeTag(x) === cur)) {
                return message.reply('❌ Le clan adverse a atteint la limite de rivaux.');
            }
            c.rivals = [...(c.rivals || []), otag];
            other.rivals = [...new Set([...(other.rivals || []), cur])];
            setClan(gid, cur, c);
            setClan(gid, otag, other);
            return message.reply(`✅ **[${cur}]** et **[${otag}]** sont désormais **rivaux**.`);
        }

        if (act === 'remove' || act === 'del' || act === 'delete') {
            c.rivals = (c.rivals || []).filter((x) => normalizeTag(x) !== otag);
            other.rivals = (other.rivals || []).filter((x) => normalizeTag(x) !== cur);
            setClan(gid, cur, c);
            setClan(gid, otag, other);
            return message.reply(`✅ Rivalité avec **[${otag}]** retirée.`);
        }

        return message.reply(`⚠️ \`${p}clan rival add <TAG> | remove <TAG> | list\``);
    }

    /** -------- war -------- */
    if (sub === 'war') {
        const wsub = (args[1] || '').toLowerCase();
        const cur = userClanTag(gid, uid);
        if (!cur) return message.reply('❌ Tu n’es dans aucun clan.');
        const c = getClan(gid, cur);
        if (c.ownerId !== uid) return message.reply('❌ Seul le chef gère la guerre.');

        if (wsub === 'status') {
            const w = findWarInvolving(gid, cur);
            if (!w) return message.reply(`ℹ️ **[${cur}]** n’est pas en guerre.`);
            const t1 = normalizeTag(w.tag1);
            const t2 = normalizeTag(w.tag2);
            const s1 = w.score1 ?? 0;
            const s2 = w.score2 ?? 0;
            const a = t1 === cur ? s1 : s2;
            const b = t1 === cur ? s2 : s1;
            const other = t1 === cur ? t2 : t1;
            const since = w.since ? `<t:${Math.floor(w.since / 1000)}:R>` : '?';
            return message.reply(
                [
                    `⚔️ Guerre : **[${cur}]** vs **[${other}]**`,
                    `Scores (activité) : **${a}** — **${b}**`,
                    `Depuis ${since}`,
                    '*(Les membres gagnent des points en discutant — même XP que le clan.)*',
                ].join('\n')
            );
        }

        if (wsub === 'cancel') {
            if (findWarInvolving(gid, cur)) {
                return message.reply('❌ Termine la guerre avec `war surrender` avant.');
            }
            if (!c.challengeTo) return message.reply('ℹ️ Aucun défi en cours.');
            const was = c.challengeTo;
            c.challengeTo = null;
            setClan(gid, cur, c);
            return message.reply(`✅ Défi vers **[${was}]** annulé.`);
        }

        if (wsub === 'surrender') {
            const w = findWarInvolving(gid, cur);
            if (!w) return message.reply('ℹ️ Pas de guerre active.');
            removeWarEntry(gid, w.key);
            const other = normalizeTag(w.tag1) === cur ? w.tag2 : w.tag1;
            return message.reply(
                `🏳️ Guerre terminée contre **[${other}]**. Scores finaux : **${w.score1 ?? 0}** — **${w.score2 ?? 0}**`
            );
        }

        const otag = normalizeTag(args[2]);
        if (wsub === 'challenge' || wsub === 'declare') {
            if (!otag) return message.reply(`⚠️ \`${p}clan war challenge <TAG>\``);
            if (otag === cur) return message.reply('❌ …');
            if (findWarInvolving(gid, cur)) return message.reply('❌ Tu es déjà en guerre.');
            const target = getClan(gid, otag);
            if (!target) return message.reply('❌ Clan introuvable.');
            const otherWar = findWarInvolving(gid, otag);
            if (otherWar) return message.reply('❌ Ce clan est déjà en guerre.');

            c.challengeTo = otag;
            setClan(gid, cur, c);
            return message.reply(
                `📣 **[${cur}]** défie **[${otag}]** ! Le chef adverse fait : \`${p}clan war accept ${cur}\``
            );
        }

        if (wsub === 'accept') {
            if (!otag) return message.reply(`⚠️ \`${p}clan war accept <TAG>\``);
            if (findWarInvolving(gid, cur)) return message.reply('❌ Tu es déjà en guerre.');
            const attacker = getClan(gid, otag);
            if (!attacker) return message.reply('❌ Clan introuvable.');
            if (normalizeTag(attacker.challengeTo) !== cur) {
                return message.reply(`❌ Aucun défi en attente de **[${otag}]** vers ton clan.`);
            }
            const t1 = normalizeTag(otag);
            const t2 = normalizeTag(cur);
            const key = warKey(t1, t2);
            if (getWars(gid)[key]) return message.reply('❌ Conflit déjà enregistré.');
            const sorted = [t1, t2].sort();
            setWarEntry(gid, key, {
                tag1: sorted[0],
                tag2: sorted[1],
                score1: 0,
                score2: 0,
                since: Date.now(),
            });
            attacker.challengeTo = null;
            setClan(gid, otag, attacker);
            const curC = getClan(gid, cur);
            if (curC) curC.challengeTo = null;
            setClan(gid, cur, curC);
            return message.reply(`⚔️ **GUERRE** déclarée entre **[${otag}]** et **[${cur}]** !`);
        }

        return message.reply(`⚠️ \`${p}clan war challenge <TAG> | accept <TAG> | cancel | surrender | status\``);
    }

    /** -------- info -------- */
    if (sub === 'info') {
        const tagArg = args[1] ? normalizeTag(args[1]) : null;

        if (!tagArg) {
            const rows = listClansSorted(gid);
            if (!rows.length) return message.reply('ℹ️ Aucun clan sur ce serveur. Crée-en un avec `clan create`.');
            const lines = rows.slice(0, 25).map((r) => {
                return `· \`[${r.tag}]\` ${r.name} — nv. **${r.level}** (${r.xp} XP) — ${r.members} membres`;
            });
            const more = rows.length > 25 ? `\n… *${rows.length - 25} de plus*` : '';
            return message.reply(['📋 **Clans sur ce serveur**', ...lines, more].filter(Boolean).join('\n'));
        }

        const c = getClan(gid, tagArg);
        if (!c) return message.reply('❌ Clan introuvable.');
        const owner = await client.users.fetch(c.ownerId).catch(() => null);
        const lv = clanLevelFromXp(c.xp || 0);
        const next = xpTotalForClanLevel(lv + 1);
        const xp = c.xp || 0;
        const memLines = await Promise.all(
            (c.members || []).slice(0, 12).map(async (id) => {
                const u = await client.users.fetch(id).catch(() => null);
                return u ? `· ${u.tag}` : `· ${id}`;
            })
        );
        const more = (c.members || []).length > 12 ? `\n… +${(c.members || []).length - 12}` : '';
        const riv = (c.rivals || []).length
            ? `\nRivaux : ${(c.rivals || []).map((t) => `\`[${normalizeTag(t)}]\``).join(', ')}`
            : '';
        const w = findWarInvolving(gid, tagArg);
        let warLine = '';
        if (w) {
            const other = normalizeTag(w.tag1) === tagArg ? w.tag2 : w.tag1;
            const myScore = normalizeTag(w.tag1) === tagArg ? w.score1 : w.score2;
            const theirScore = normalizeTag(w.tag1) === tagArg ? w.score2 : w.score1;
            warLine = `\n⚔️ En guerre vs **[${other}]** — ${myScore ?? 0} / ${theirScore ?? 0}`;
        }
        const roleLine = c.roleId ? `\nRôle : <@&${c.roleId}>` : '';

        return message.reply(
            [
                `🏰 **${tagArg}** — ${c.name}`,
                `Niveau **${lv}** · **${xp}** / ${next} XP (palier suivant)`,
                `Chef : ${owner ? owner.tag : c.ownerId}`,
                `Membres (${(c.members || []).length + 1}) :`,
                owner ? `· ${owner.tag} (chef)` : '',
                ...memLines,
                more,
                riv + warLine + roleLine,
            ]
                .filter(Boolean)
                .join('\n')
        );
    }

    return message.reply(`⚠️ \`${p}clan help\``);
};
