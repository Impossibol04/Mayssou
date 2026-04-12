const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

const HELP_SELECT_ID = 'mayssou:help';
const HELP_PAGE_PREFIX = 'mayssou:hp:';

const PREFIX = (process.env.prefix || '+').trim() || '+';

const GITHUB_USER = 'Impossibol04';
const GITHUB_PROFILE = `https://github.com/${GITHUB_USER}`;
const GITHUB_REPO = `https://github.com/${GITHUB_USER}/Mayssou`;

function getBotIconURL(client) {
    try {
        return client?.user?.displayAvatarURL({ extension: 'png', size: 256 }) || undefined;
    } catch {
        return undefined;
    }
}

const COLORS = {
    home: 0x5865f2,
    moderation: 0xed4245,
    config: 0xfee75c,
    utility: 0x57f287,
    music: 0xff5500,
    voice: 0x5865f2,
    social: 0xeb459e,
    fun: 0x9b59b6,
    server: 0x3498db,
    security: 0x2c3e50,
};

const CATEGORY_ALIASES = {
    accueil: 'home',
    home: 'home',
    mod: 'moderation',
    moderation: 'moderation',
    config: 'config',
    configuration: 'config',
    util: 'utility',
    utilitaire: 'utility',
    utility: 'utility',
    musique: 'music',
    music: 'music',
    vocal: 'voice',
    voice: 'voice',
    social: 'social',
    fun: 'fun',
    serveur: 'server',
    server: 'server',
    securite: 'security',
    security: 'security',
};

const CATEGORIES = [
    { value: 'home', label: 'Accueil', emoji: '🏠', desc: 'Guide, préfixe, liens GitHub' },
    { value: 'moderation', label: 'Modération', emoji: '🛡️', desc: 'Sanctions, warns, salon, vocal' },
    { value: 'config', label: 'Configuration', emoji: '⚙️', desc: 'Préfixe, welcome, confess…' },
    { value: 'utility', label: 'Utilitaire', emoji: '🤓', desc: 'Ping, stats, météo…' },
    { value: 'music', label: 'Musique', emoji: '🎵', desc: 'SoundCloud, file, volume' },
    { value: 'voice', label: 'Vocal', emoji: '🎙️', desc: 'Hub, join, TTS, limite' },
    { value: 'social', label: 'Social', emoji: '🤫', desc: 'Confess, poll, rep' },
    { value: 'fun', label: 'Fun', emoji: '✨', desc: 'Jeux, XP, ship…' },
    { value: 'server', label: 'Serveur', emoji: '🏛️', desc: 'Audit, infos' },
    { value: 'security', label: 'Sécurité bot', emoji: '🔐', desc: 'Owner' },
];

function resolveHelpCategory(arg) {
    if (!arg || typeof arg !== 'string') return 'home';
    const k = arg.toLowerCase().trim();
    return CATEGORY_ALIASES[k] || (CATEGORIES.some((c) => c.value === k) ? k : 'home');
}

function buildSelectRow(current) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(HELP_SELECT_ID)
            .setPlaceholder('✦ Choisir une catégorie…')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                CATEGORIES.map((c) => ({
                    label: c.label,
                    value: c.value,
                    emoji: c.emoji,
                    description: c.desc.slice(0, 100),
                    default: c.value === current,
                }))
            )
    );
}

/** Ligne compacte : préfixe + slash + détail */
function L(p, name, slash, detail) {
    const pr = `\`${p}${name}\``;
    const sl = slash ? ` · \`/${slash}\`` : '';
    return `${pr}${sl}\n└ ${detail}`;
}

function buildHomeEmbed(botIconURL) {
    const p = PREFIX;
    const author = {
        name: `Mayssou — ${GITHUB_USER}`,
        url: GITHUB_PROFILE,
    };
    if (botIconURL) author.iconURL = botIconURL;

    const embed = new EmbedBuilder()
        .setColor(COLORS.home)
        .setAuthor(author)
        .setTitle('✦ Centre d’aide Mayssou')
        .setURL(GITHUB_REPO)
        .setDescription(
            'Bot **modération**, **musique** (SoundCloud), **vocaux temporaires**, **fun** et **outils**.\n\n' +
                '*Slash (`/`) ou **préfixe** — chaque catégorie s’ouvre sur une **page courte** ; **◀ ▶** pour feuilleter.*'
        )
        .addFields(
            {
                name: '⌨️ Préfixe',
                value: `**Actif :** \`${p}\` · \`${p}setprefix\` / \`reset\` *(admin)*`,
                inline: false,
            },
            {
                name: '🔗 Liens',
                value: `[**${GITHUB_USER}**](${GITHUB_PROFILE}) · [**Mayssou**](${GITHUB_REPO})`,
                inline: false,
            },
            {
                name: '🧭 Navigation',
                value:
                    `Menu **ci-dessous** pour la catégorie · **◀ ▶** quand il y a plusieurs pages\n` +
                    `\`${p}help moderation\` pour ouvrir direct une rubrique`,
                inline: false,
            }
        )
        .setFooter({ text: `Mayssou · ${p} ou /` })
        .setTimestamp();

    if (botIconURL) embed.setThumbnail(botIconURL);
    return embed;
}

/**
 * Données paginées : chaque entrée = une page (description = liste de L()).
 * Clé = catégorie (hors home).
 */
function getCategoryPageDefs(p) {
    return {
        moderation: [
            {
                emoji: '🛡️',
                title: 'Modération',
                hint: 'Messages, slowmode, locks.',
                lines: [
                    L(p, 'clear', 'clear', 'Supprime **1–100** messages. *Gérer les messages.*'),
                    L(p, 'purgeuser', 'purgeuser', 'Purge les messages **d’un membre** dans le salon.'),
                    L(p, 'slowmode', 'slowmode', 'Mode lent en **secondes**.'),
                    L(p, 'lock', 'lock', 'Ferme le salon à @everyone.'),
                    L(p, 'unlock', 'unlock', 'Rouvre le salon.'),
                ],
            },
            {
                emoji: '🛡️',
                title: 'Modération',
                hint: 'Warns & notes staff.',
                lines: [
                    L(p, 'warn', 'warn', 'Warn interne + **raison**.'),
                    L(p, 'warnlist', 'warnlist', 'Tous les warnés (**pages + boutons**) ou détail **@membre**.'),
                    L(p, 'cleanwarn', 'cleanwarn', 'Efface les warns ; **`all`** → confirmation *(owner / Gérer serveur)*.'),
                    L(p, 'modnote', 'modnote', 'Notes staff **add / list / del**.'),
                ],
            },
            {
                emoji: '🛡️',
                title: 'Modération',
                hint: 'Bans & exclusions.',
                lines: [
                    L(p, 'kick', 'kick', 'Expulsion + raison.'),
                    L(p, 'ban', 'ban', 'Ban + purge possible.'),
                    L(p, 'unban', 'unban', 'Déban par **ID** / utilisateur.'),
                    L(p, 'banlist', 'banlist', 'Liste des bannis · **pagination ◀ ▶**.'),
                    L(p, 'banmass', 'banmass', 'Jusqu’à **25** cibles · **confirmation boutons**.'),
                    L(p, 'softban', 'softban', 'Ban + déban pour **purger** l’historique.'),
                ],
            },
            {
                emoji: '🛡️',
                title: 'Modération',
                hint: 'Timeout Discord.',
                lines: [
                    L(p, 'timeout', 'timeout', 'Exclusion **minutes**.'),
                    L(p, 'unmute', 'unmute', 'Fin du timeout.'),
                    L(p, 'untimeout', 'untimeout', 'Idem **untimeout** Discord.'),
                ],
            },
            {
                emoji: '🎧',
                title: 'Modération',
                hint: 'Vocal, signalement, emoji, trad.',
                lines: [
                    L(p, 'vmute', 'vmute', 'Muet **dans le vocal**.'),
                    L(p, 'vunmute', 'vunmute', 'Rétablit le micro.'),
                    L(p, 'vdeafen', 'vdeafen', 'Sourd forcé.'),
                    L(p, 'vundeafen', 'vundeafen', 'Retire le sourd.'),
                    L(p, 'vkick', 'vkick', 'Déconnecte du **vocal**.'),
                    L(p, 'vmove', 'vmove', 'Déplace vers un autre vocal.'),
                    L(p, 'report', 'report', 'Signalement → **modlogs**.'),
                    L(p, 'antiraid', null, 'Pic d’**arrivées** · on/off · exempt. *Admin.*'),
                    L(p, 'steal', 'steal', 'Vole un **emoji** (message ou ID).'),
                    L(p, 'settranslate', null, 'Active / coupe **`translate`** sur le serveur.'),
                ],
            },
            {
                emoji: '🏷️',
                title: 'Modération',
                hint: 'Rôles.',
                lines: [
                    L(p, 'addrole', 'addrole', 'Ajoute des **rôles**.'),
                    L(p, 'removerole', 'removerole', 'Retire des **rôles**.'),
                ],
            },
        ],
        config: [
            {
                emoji: '⚙️',
                title: 'Configuration',
                hint: 'Préfixe & langue.',
                lines: [
                    L(p, 'setprefix', null, 'Préfixe **1–8** car. ou `reset`. *Admin.*'),
                    L(p, 'language', null, '`fr` / `en` (ex. **translate**).'),
                ],
            },
            {
                emoji: '⚙️',
                title: 'Configuration',
                hint: 'Salons & hub vocal.',
                lines: [
                    L(p, 'setconfess', 'setconfess', 'Salon **confessions**.'),
                    L(p, 'setwelcome', 'setwelcome', '**join** / **leave** + salons.'),
                    L(p, 'setmodlogs', 'setmodlogs', 'Salon **logs** modération.'),
                    L(p, 'setjoinvoice', 'setjoinvoice', 'Hub **Créer un vocal**.'),
                    L(p, 'deletejoinvoice', 'deletejoinvoice', 'Supprime le hub.'),
                ],
            },
        ],
        utility: [
            {
                emoji: '🤓',
                title: 'Utilitaire',
                hint: 'Bot & profils.',
                lines: [
                    L(p, 'ping', 'ping', 'Latence bot & **gateway**.'),
                    L(p, 'uptime', 'uptime', 'Temps depuis le **démarrage**.'),
                    L(p, 'userinfo', 'userinfo', 'Fiche **utilisateur**.'),
                    L(p, 'serverinfo', 'serverinfo', 'Fiche **serveur**.'),
                    L(p, 'stats', 'stats', 'Carte **image** activité.'),
                    L(p, 'leaderboard', 'leaderboard', 'Classement · **`lb`** · **`top`**.'),
                ],
            },
            {
                emoji: '🤓',
                title: 'Utilitaire',
                hint: 'Snipe, calc, AFK.',
                lines: [
                    L(p, 'snipe', 'snipe', 'Dernier message **supprimé**.'),
                    L(p, 'calc', 'calc', 'Calculatrice.'),
                    L(p, 'afk', 'afk', 'Statut **AFK** + message.'),
                ],
            },
            {
                emoji: '🤓',
                title: 'Utilitaire',
                hint: 'Web, IA, anniversaires.',
                lines: [
                    L(p, 'translate', 'translate', 'Traduction · coupable via `settranslate`.'),
                    L(p, 'weather', null, 'Météo **ville**.'),
                    L(p, 'inviteinfo', 'inviteinfo', '**Stats invites** du serveur. *Gérer le serveur.*'),
                    L(p, 'ask', null, 'IA · *staff + OPENAI_API_KEY*.'),
                    L(p, 'summarize', null, 'Résumé · *idem*.'),
                    L(p, 'setbirthday', null, 'Date **JJ/MM** · rappels UTC.'),
                    L(p, 'birthday', 'birthday', 'Qui a une date enregistrée.'),
                ],
            },
        ],
        music: [
            {
                emoji: '🎵',
                title: 'Musique',
                hint: 'Lecture SoundCloud — même **vocal** que le bot.',
                lines: [
                    L(p, 'play', 'play', 'Joue · **`-k`** / slash *karaoké*.'),
                    L(p, 'leave', 'leave', 'Quitte le vocal · vide la session.'),
                    L(p, 'stop', 'stop', 'Stop & vide la file.'),
                    L(p, 'pause', 'pause', 'Pause / reprise.'),
                    L(p, 'skip', 'skip', 'Piste suivante.'),
                    L(p, 'replay', 'replay', 'Rejoue depuis le début.'),
                ],
            },
            {
                emoji: '🎵',
                title: 'Musique',
                hint: 'File & options.',
                lines: [
                    L(p, 'queue', 'queue', 'File · alias **`q`**.'),
                    L(p, 'nowplaying', 'nowplaying', 'En cours · **`np`**.'),
                    L(p, 'volume', 'volume', 'Volume.'),
                    L(p, 'shuffle', 'shuffle', 'Mélange la file.'),
                    L(p, 'remove', 'remove', 'Retire une position.'),
                    L(p, 'skipto', 'skipto', 'Saute à une position.'),
                    L(p, 'seek', 'seek', 'Avance **secondes**.'),
                    L(p, 'loop', 'loop', 'Boucle file / morceau.'),
                    L(p, 'autoplay', 'autoplay', 'Enchaîne SoundCloud lié à l’artiste.'),
                    L(p, 'lyrics', 'lyrics', 'Paroles.'),
                ],
            },
        ],
        voice: [
            {
                emoji: '🎙️',
                title: 'Vocal',
                hint: 'Hub temporaire + musique.',
                lines: [
                    '**Hub** — `setjoinvoice` : salon **➕ Créer un vocal** → vocal privé + **panneau** (MP ou salon).',
                    L(p, 'join', 'join', 'Le bot **rejoint ton vocal** pour la musique *(sans lancer de piste)*.'),
                    L(p, 'voicename', 'voicename', 'Renomme **ton** temporaire.'),
                    L(p, 'voicelimit', 'voicelimit', 'Limite **0–99** + **boutons** rapides.'),
                    L(p, 'tts', 'tts', 'Lit un **texte** dans le vocal.'),
                ],
            },
        ],
        social: [
            {
                emoji: '🤫',
                title: 'Social',
                hint: 'Confess, sondages, rep.',
                lines: [
                    L(p, 'confess', 'confess', 'Confession **anonyme** → salon config.'),
                    L(p, 'poll', 'poll', '**Sondage**.'),
                    L(p, 'rep', 'rep', '**+1 rep** / jour / personne.'),
                ],
            },
        ],
        fun: [
            {
                emoji: '✨',
                title: 'Fun',
                hint: 'Jeux & images.',
                lines: [
                    L(p, '8ball', 'eightball', '8-ball.'),
                    L(p, 'avatar', 'avatar', 'Avatar.'),
                    L(p, 'banner', 'banner', 'Bannière.'),
                    L(p, 'love', 'love', 'Score love.'),
                    L(p, 'rate', 'rate', 'Note /10.'),
                    L(p, 'gay', 'gay', 'Humour.'),
                    L(p, '67', 'sixseven', 'Réf. · `/sixseven`.'),
                    L(p, 'ship', 'ship', 'Compatibilité.'),
                ],
            },
            {
                emoji: '✨',
                title: 'Fun',
                hint: 'XP.',
                lines: [L(p, 'level', 'level', 'Niveaux **XP** messages (cooldown).')],
            },
        ],
        server: [
            {
                emoji: '🏛️',
                title: 'Serveur',
                hint: 'Audit & infos.',
                lines: [
                    L(p, 'audit', 'audit', 'Journal **audit**.'),
                    L(p, 'roleinfo', 'roleinfo', 'Infos **rôle**.'),
                    L(p, 'channelinfo', 'channelinfo', 'Infos **salon**.'),
                    L(p, 'emojiinfo', 'emojiinfo', 'Emoji **du serveur**.'),
                ],
            },
        ],
        security: [
            {
                emoji: '🔐',
                title: 'Sécurité bot',
                hint: 'Owner · `OWNER_ID`.',
                lines: [
                    L(p, 'debug', 'debug', 'État process, ping, mémoire.'),
                    L(p, 'blacklist', 'blacklist', '`list` · `add` · `remove` — serveurs interdits.'),
                ],
            },
        ],
    };
}

function getPageArray(cat) {
    const defs = getCategoryPageDefs(PREFIX)[cat];
    return defs || null;
}

function getHelpPageCount(cat) {
    if (cat === 'home') return 1;
    const arr = getPageArray(cat);
    return arr ? arr.length : 1;
}

function buildCategoryPageEmbed(cat, botIconURL, pageIndex) {
    const color = COLORS[cat] ?? COLORS.home;
    const pages = getPageArray(cat);
    if (!pages?.length) return { embed: buildHomeEmbed(botIconURL), totalPages: 1 };

    const total = pages.length;
    const p = Math.min(Math.max(0, pageIndex), total - 1);
    const chunk = pages[p];
    const body = chunk.lines.join('\n\n');

    const author = { name: 'Mayssou · Aide', url: GITHUB_REPO };
    if (botIconURL) author.iconURL = botIconURL;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor(author)
        .setTitle(`${chunk.emoji} ${chunk.title} · **${p + 1}/${total}**`)
        .setDescription(`*${chunk.hint}*\n\n${body}`.slice(0, 4096))
        .setTimestamp();

    embed.setFooter({
        text:
            total > 1
                ? `${PREFIX} ou / · ◀ ▶ pour tourner les pages`
                : `${PREFIX} ou / · Menu pour une autre catégorie`,
    });

    if (botIconURL) embed.setThumbnail(botIconURL);
    return { embed, totalPages: total };
}

function helpPageButtonId(userId, cat, targetPage) {
    return `${HELP_PAGE_PREFIX}${userId}:${cat}:${targetPage}`;
}

function buildHelpNavRow(openerUserId, cat, currentPage, totalPages) {
    if (totalPages <= 1) return null;

    const prev = Math.max(0, currentPage - 1);
    const next = Math.min(totalPages - 1, currentPage + 1);

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(helpPageButtonId(openerUserId, cat, prev))
            .setStyle(ButtonStyle.Primary)
            .setEmoji('◀')
            .setDisabled(currentPage <= 0),
        new ButtonBuilder()
            .setCustomId(helpPageButtonId(openerUserId, cat, next))
            .setStyle(ButtonStyle.Primary)
            .setEmoji('▶')
            .setDisabled(currentPage >= totalPages - 1)
    );
}

/**
 * @param {string} categoryKey
 * @param {import('discord.js').Client} client
 * @param {{ openerUserId?: string, page?: number }} [opts]
 */
function buildHelpPayload(categoryKey, client, opts = {}) {
    const botIconURL = getBotIconURL(client);
    const cat = resolveHelpCategory(categoryKey);
    const openerUserId = opts.openerUserId || null;
    let page = Number.isFinite(opts.page) ? opts.page : 0;

    if (cat === 'home') {
        return {
            embeds: [buildHomeEmbed(botIconURL)],
            components: [buildSelectRow('home')],
        };
    }

    const { embed, totalPages } = buildCategoryPageEmbed(cat, botIconURL, page);
    page = Math.min(Math.max(0, page), totalPages - 1);

    const rows = [buildSelectRow(cat)];
    const nav = openerUserId ? buildHelpNavRow(openerUserId, cat, page, totalPages) : null;
    if (nav) rows.push(nav);

    return {
        embeds: [embed],
        components: rows,
    };
}

function parseHelpPageCustomId(customId) {
    const raw = customId.slice(HELP_PAGE_PREFIX.length);
    const lastColon = raw.lastIndexOf(':');
    if (lastColon === -1) return null;
    const pageStr = raw.slice(lastColon + 1);
    const rest = raw.slice(0, lastColon);
    const firstColon = rest.indexOf(':');
    if (firstColon === -1) return null;
    const userId = rest.slice(0, firstColon);
    const category = rest.slice(firstColon + 1);
    const page = parseInt(pageStr, 10);
    if (!/^\d{17,20}$/.test(userId) || !/^[a-z]+$/.test(category) || Number.isNaN(page)) return null;
    return { userId, category, page };
}

/**
 * @returns {Promise<boolean>} true si géré
 */
async function handleHelpPagination(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith(HELP_PAGE_PREFIX)) return false;

    const parsed = parseHelpPageCustomId(interaction.customId);
    if (!parsed) return false;

    if (interaction.user.id !== parsed.userId) {
        await interaction.reply({
            ephemeral: true,
            content: '❌ Seul celui qui a ouvert l’aide peut changer de page.',
        });
        return true;
    }

    const total = getHelpPageCount(parsed.category);
    const clamped = Math.min(Math.max(0, parsed.page), Math.max(0, total - 1));

    try {
        await interaction.update(
            buildHelpPayload(parsed.category, interaction.client, {
                openerUserId: parsed.userId,
                page: clamped,
            })
        );
    } catch (err) {
        console.error('help pagination:', err);
        await interaction.reply({ ephemeral: true, content: '❌ Impossible de mettre à jour l’aide.' }).catch(() => {});
    }
    return true;
}

module.exports = {
    HELP_SELECT_ID,
    HELP_PAGE_PREFIX,
    resolveHelpCategory,
    buildHelpPayload,
    buildSelectRow,
    getBotIconURL,
    handleHelpPagination,
    getHelpPageCount,
};
