const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require('discord.js');

const HELP_SELECT_ID = 'mayssou:help';

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
    { value: 'moderation', label: 'Modération', emoji: '🛡️', desc: 'Sanctions, warns, salon, vocal staff' },
    { value: 'config', label: 'Configuration', emoji: '⚙️', desc: 'Préfixe, welcome, confess, modlogs…' },
    { value: 'utility', label: 'Utilitaire', emoji: '🤓', desc: 'Ping, stats, météo, traduction…' },
    { value: 'music', label: 'Musique', emoji: '🎵', desc: 'SoundCloud, file, volume, paroles' },
    { value: 'voice', label: 'Vocal', emoji: '🎙️', desc: 'Hub privé, TTS, limite' },
    { value: 'social', label: 'Social', emoji: '🤫', desc: 'Confessions, sondages, réputation' },
    { value: 'fun', label: 'Fun', emoji: '✨', desc: 'Jeux, niveaux, ship…' },
    { value: 'server', label: 'Serveur', emoji: '🏛️', desc: 'Audit, infos salon/rôle/emoji' },
    { value: 'security', label: 'Sécurité bot', emoji: '🔐', desc: 'Owner — debug & blacklist' },
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
            .setPlaceholder('✦ Explorer une catégorie…')
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

/** Ligne courte : commande + slash + détail (une phrase). */
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
            'Bot Discord **modération**, **musique** (SoundCloud), **vocaux temporaires**, **fun** et **outils**.\n\n' +
                '*Tout est utilisable en **slash** (`/`) ou avec le **préfixe** affiché ci-contre.*'
        )
        .addFields(
            {
                name: '⌨️ Préfixe sur ce serveur',
                value: `**Actif :** \`${p}\`\nLes admins peuvent le changer avec \`${p}setprefix\` (1–8 caractères) ou \`${p}setprefix reset\`.\nLes **commandes slash** ne dépendent pas du préfixe.`,
                inline: false,
            },
            {
                name: '🔗 Liens',
                value: `[Profil GitHub — **${GITHUB_USER}**](${GITHUB_PROFILE})\n[Dépôt **Mayssou**](${GITHUB_REPO})`,
                inline: false,
            },
            {
                name: '🧭 Navigation',
                value:
                    `• \`${p}help\` ou \`/help\` — ce panneau\n` +
                    `• \`${p}help moderation\` — ouvre une catégorie sans menu\n` +
                    `• Utilise le **menu déroulant** pour feuilleter toutes les commandes *avec détails*.`,
                inline: false,
            }
        )
        .setFooter({ text: `Mayssou · Slash + préfixe ${p} · ${GITHUB_USER}` })
        .setTimestamp();

    if (botIconURL) embed.setThumbnail(botIconURL);
    return embed;
}

/**
 * Construit 1 embed d’en-tête + N embeds de sections (plus lisible que un pavé unique).
 */
function buildCategoryEmbeds(key, botIconURL) {
    const p = PREFIX;
    const color = COLORS[key] ?? COLORS.home;
    const foot = `Menu ci-dessous · ${p} ou / · Page d’aide Mayssou`;

    const authorBase = (title) => {
        const a = { name: `Mayssou · ${title}`, url: GITHUB_REPO };
        if (botIconURL) a.iconURL = botIconURL;
        return a;
    };

    const hero = (emoji, title, subtitle) => {
        const e = new EmbedBuilder()
            .setColor(color)
            .setAuthor(authorBase('Aide détaillée'))
            .setTitle(`${emoji} ${title}`)
            .setDescription(
                (
                    `*${subtitle}*\n\n` +
                    '━━━━━━━━━━━━━━━━━━\n' +
                    '**Ci-dessous :** chaque bloc regroupe des commandes **similaires**.\n' +
                    'La ligne du haut = **préfixe** ; **`/slash`** quand il existe.'
                ).slice(0, 4096)
            );
        if (botIconURL) e.setThumbnail(botIconURL);
        return e;
    };

    const section = (title, lines) => {
        const body = Array.isArray(lines) ? lines.join('\n\n') : lines;
        return new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(body.slice(0, 4096));
    };

    function finalize(embeds) {
        const last = embeds[embeds.length - 1];
        last.setFooter({ text: foot }).setTimestamp();
        return embeds;
    }

    const sheets = {
        moderation: () => {
            const h = hero('🛡️', 'Modération', 'Sanctions, salon, warns et outils staff — permissions Discord selon chaque action.');
            const e1 = section('🧹 Messages & salon', [
                L(p, 'clear', 'clear', 'Supprime **1 à 100** messages dans le salon. *Gérer les messages.*'),
                L(p, 'purgeuser', 'purgeuser', 'Retire les messages **d’un membre** dans le salon (selon limites du bot).'),
                L(p, 'slowmode', 'slowmode', 'Règle le **mode lent** en secondes sur le salon ciblé.'),
                L(p, 'lock', 'lock', 'Empêche @everyone d’écrire (sauf permissions override).'),
                L(p, 'unlock', 'unlock', 'Rouvre le salon pour @everyone.'),
            ]);
            const e2 = section('⚠️ Avertissements & notes', [
                L(p, 'warn', 'warn', 'Ajoute un **warn** interne au bot + raison (historique modération).'),
                L(p, 'warnlist', 'warnlist', 'Vue **paginée** de tous les membres warnés + boutons ; ou warns d’un **@membre**.'),
                L(p, 'cleanwarn', 'cleanwarn', 'Efface les warns d’un membre. **`all`** = tout le serveur → **confirmation** (owner / Gérer le serveur).'),
                L(p, 'modnote', 'modnote', '**Notes staff** (add / list / del) visibles équipe, hors warns publics.'),
            ]);
            const e3 = section('🔨 Bans, kicks, timeout', [
                L(p, 'kick', 'kick', 'Expulse un membre avec raison (optionnelle).'),
                L(p, 'ban', 'ban', 'Bannit du serveur (purge messages possible selon options Discord).'),
                L(p, 'unban', 'unban', 'Débannit par **ID** ou utilisateur.'),
                L(p, 'banlist', 'banlist', 'Liste **tous** les bannis, **pagination** + boutons.'),
                L(p, 'banmass', 'banmass', 'Jusqu’à **25** cibles (mentions + IDs) ; **embed + boutons** de confirmation obligatoires.'),
                L(p, 'softban', 'softban', 'Ban puis déban pour **purger** l’historique récent du membre.'),
                L(p, 'timeout', 'timeout', 'Timeout Discord (**minutes**).'),
                L(p, 'unmute', 'unmute', 'Retire le timeout (synonyme pratique d’untimeout).'),
                L(p, 'untimeout', 'untimeout', 'Fin d’exclusion temporaire Discord.'),
            ]);
            const e4 = section('🎧 Modération vocale & divers', [
                L(p, 'vmute', 'vmute', 'Coupe le micro d’un membre **dans le vocal**.'),
                L(p, 'vunmute', 'vunmute', 'Rétablit le micro.'),
                L(p, 'vdeafen', 'vdeafen', 'Casque (sourd) forcé dans le vocal.'),
                L(p, 'vundeafen', 'vundeafen', 'Retire le casque forcé.'),
                L(p, 'vkick', 'vkick', 'Déconnecte du **salon vocal** uniquement.'),
                L(p, 'vmove', 'vmove', 'Déplace vers un autre salon vocal.'),
                L(p, 'report', 'report', 'Envoie un **signalement** vers le salon **modlogs** si configuré.'),
                L(p, 'antiraid', null, 'Seuil d’**arrivées** / fenêtre, **on/off**, rôle **exempt**. *Admin.*'),
                L(p, 'steal', 'steal', '**Vole** un emoji (dans le message ou par ID) ; *Gérer emojis*.'),
                L(p, 'settranslate', null, 'Autorise ou **désactive** la commande `translate` sur le serveur.'),
            ]);
            const e5 = section('🏷️ Rôles', [
                L(p, 'addrole', 'addrole', 'Ajoute un ou plusieurs rôles à un membre.'),
                L(p, 'removerole', 'removerole', 'Retire des rôles.'),
            ]);
            return finalize([h, e1, e2, e3, e4, e5]);
        },
        config: () => {
            const h = hero('⚙️', 'Configuration', 'Paramètres du bot **par serveur** — souvent *Gérer le serveur* ou *Administrateur*.');
            const e1 = section('Préfixe & langue', [
                L(p, 'setprefix', null, 'Définit le **préfixe** (1–8 car.) ou `reset` pour l’env. *Admin.*'),
                L(p, 'language', null, '`fr` / `en` — influence certaines réponses (ex. **translate**).'),
            ]);
            const e2 = section('Salons & événements', [
                L(p, 'setconfess', 'setconfess', 'Salon où arrivent les **confessions** anonymes.'),
                L(p, 'setwelcome', 'setwelcome', 'Sous-commandes **join** / **leave** + salon pour messages d’accueil ou départ.'),
                L(p, 'setmodlogs', 'setmodlogs', 'Salon des **logs** de modération (reports, actions, etc.).'),
            ]);
            const e3 = section('Vocaux temporaires (hub)', [
                L(p, 'setjoinvoice', 'setjoinvoice', 'Crée le salon **hub** « Créer un vocal » ; catégorie optionnelle.'),
                L(p, 'deletejoinvoice', 'deletejoinvoice', 'Supprime le hub et la config associée.'),
            ]);
            return finalize([h, e1, e2, e3]);
        },
        utility: () => {
            const h = hero('🤓', 'Utilitaire', 'Infos, stats, outils pratiques et APIs externes.');
            const e1 = section('Bot & membres', [
                L(p, 'ping', 'ping', 'Latence **message ↔ bot** et **gateway WebSocket**.'),
                L(p, 'uptime', 'uptime', 'Temps depuis le **dernier démarrage** du processus.'),
                L(p, 'userinfo', 'userinfo', 'Fiche **utilisateur** (compte, arrivée, rôles…).'),
                L(p, 'serverinfo', 'serverinfo', 'Fiche **serveur** (création, boosts, compteurs…).'),
                L(p, 'stats', 'stats', 'Carte **image** : messages & vocal (avec classements de salons).'),
                L(p, 'leaderboard', 'leaderboard', 'Classement du serveur ; alias **`lb`**, **`top`**.'),
            ]);
            const e2 = section('Contenu & calcul', [
                L(p, 'snipe', 'snipe', 'Dernier message **supprimé** récent dans le salon.'),
                L(p, 'calc', 'calc', 'Calculatrice (**expression** math).'),
                L(p, 'afk', 'afk', 'Statut **AFK** + message ; levé à la prochaine activité.'),
            ]);
            const e3 = section('Web & IA', [
                L(p, 'translate', 'translate', 'Traduction (service externe) — peut être coupé avec `settranslate`.'),
                L(p, 'weather', null, 'Météo par **ville** (API).'),
                L(p, 'inviteinfo', 'inviteinfo', 'Métadonnées d’une **invitation** Discord. *Modérer les membres.*'),
                L(p, 'ask', null, 'Question à l’IA. *Staff + variable `OPENAI_API_KEY`.*'),
                L(p, 'summarize', null, 'Résumé de texte. *Idem.*'),
            ]);
            const e4 = section('Anniversaires', [
                L(p, 'setbirthday', null, 'Enregistre ta date (**JJ/MM**) pour rappel serveur (fuseau **UTC** / salon système).'),
                L(p, 'birthday', 'birthday', 'Voir qui a une date enregistrée.'),
            ]);
            return finalize([h, e1, e2, e3, e4]);
        },
        music: () => {
            const h = hero('🎵', 'Musique', 'Lecture **SoundCloud** — tu dois être dans le **même vocal** que le bot pour piloter.');
            const e1 = section('Lecture & connexion', [
                L(p, 'play', 'play', 'Recherche et joue un titre. **`-k`** ou option slash *karaoké* pour instrumental.'),
                L(p, 'join', 'join', 'Le bot **rejoint ton vocal** sans lancer de piste (prépare la session).'),
                L(p, 'leave', 'leave', 'Quitte le vocal et **vide** la session musique du serveur.'),
                L(p, 'stop', 'stop', 'Arrête la lecture et vide la file.'),
                L(p, 'pause', 'pause', 'Pause / reprise selon l’état du lecteur.'),
                L(p, 'skip', 'skip', 'Passe à la **piste suivante**.'),
                L(p, 'replay', 'replay', 'Rejoue depuis le **début**.'),
            ]);
            const e2 = section('File & options', [
                L(p, 'queue', 'queue', 'Affiche la file ; alias **`q`**.'),
                L(p, 'nowplaying', 'nowplaying', 'Piste en cours ; alias **`np`**.'),
                L(p, 'volume', 'volume', 'Volume **0–100** (ou selon limites du bot).'),
                L(p, 'shuffle', 'shuffle', 'Mélange la **file d’attente**.'),
                L(p, 'remove', 'remove', 'Retire une piste par **position** dans la file.'),
                L(p, 'skipto', 'skipto', 'Saute à une **position** donnée.'),
                L(p, 'seek', 'seek', 'Avance dans la piste (**secondes**).'),
                L(p, 'loop', 'loop', 'Boucle **file** ou **morceau** selon mode.'),
                L(p, 'autoplay', 'autoplay', 'Enchaîne des titres **SoundCloud** liés à l’artiste courant.'),
                L(p, 'lyrics', 'lyrics', 'Paroles (source externe) ; syntaxe selon le bot.'),
            ]);
            return finalize([h, e1, e2]);
        },
        voice: () => {
            const h = hero('🎙️', 'Vocal & hub', 'Salons **temporaires** créés depuis un hub + **TTS**.');
            const e1 = section('Hub & panneau', [
                '**Hub** — configuré avec `setjoinvoice` : un salon « Créer un vocal » duplique un **vocal privé** pour toi.',
                '**Panneau propriétaire** — message (salon du vocal ou **MP**) avec boutons : **renommer**, **limite**, **exclure**, **bloquer**, préréglages de places, **fermer le panneau**.',
            ]);
            const e2 = section('Commandes', [
                L(p, 'voicename', 'voicename', 'Renomme **ton** vocal temporaire (préfixe 🔊 géré par le bot).'),
                L(p, 'voicelimit', 'voicelimit', 'Définit la **limite** (0–99) + message avec **boutons** rapides.'),
                L(p, 'tts', 'tts', 'Lit un **texte** à voix haute dans le vocal où tu es.'),
            ]);
            return finalize([h, e1, e2]);
        },
        social: () => {
            const h = hero('🤫', 'Social', 'Confessions, sondages et réputation légère.');
            const e1 = section('Commandes', [
                L(p, 'confess', 'confess', 'Envoie une **confession anonyme** au salon configuré (`setconfess`).'),
                L(p, 'poll', 'poll', 'Crée un **sondage** (question dans ta commande).'),
                L(p, 'rep', 'rep', 'Donne **+1 réputation** à quelqu’un (**1 fois / jour / personne**).'),
            ]);
            return finalize([h, e1]);
        },
        fun: () => {
            const h = hero('✨', 'Fun', 'Jeux, images et progression **XP** sur les messages.');
            const e1 = section('Jeux & images', [
                L(p, '8ball', 'eightball', 'Réponse aléatoire style **magic 8-ball**.'),
                L(p, 'avatar', 'avatar', 'Affiche l’**avatar** d’un utilisateur.'),
                L(p, 'banner', 'banner', 'Bannière de profil si visible.'),
                L(p, 'love', 'love', 'Score **love** entre deux personnes.'),
                L(p, 'rate', 'rate', 'Note quelque chose sur **10**.'),
                L(p, 'gay', 'gay', 'Score **humoristique** (à prendre au second degré).'),
                L(p, '67', 'sixseven', 'Référence communautaire ; slash **`/sixseven`**.'),
                L(p, 'ship', 'ship', '**Compatibilité** aléatoire entre deux membres.'),
            ]);
            const e2 = section('Progression', [
                L(p, 'level', 'level', 'Niveau **XP** gagné en écrivant (cooldown pour éviter le spam).'),
            ]);
            return finalize([h, e1, e2]);
        },
        server: () => {
            const h = hero('🏛️', 'Serveur', 'Audit et fiches **métadonnées** (permissions requises selon la commande).');
            const e1 = section('Commandes', [
                L(p, 'audit', 'audit', 'Affiche les **dernières entrées** du journal d’audit (actions staff).'),
                L(p, 'roleinfo', 'roleinfo', 'Détails d’un **rôle** (membres, couleur, permissions…).'),
                L(p, 'channelinfo', 'channelinfo', 'Infos sur un **salon** (type, position, slowmode…).'),
                L(p, 'emojiinfo', 'emojiinfo', 'Infos sur un **emoji du serveur** (pas les Unicode seuls).'),
            ]);
            return finalize([h, e1]);
        },
        security: () => {
            const h = hero('🔐', 'Sécurité bot', 'Réservé au **propriétaire** du bot (`OWNER_ID` / variables d’environnement).');
            const e1 = section('Commandes', [
                L(p, 'debug', 'debug', 'État du process : **serveurs**, mémoire, **ping WS**, version **Node**, uptime.'),
                L(p, 'blacklist', 'blacklist', '`list` / `add <id>` / `remove <id>` — serveurs où le bot **refuse** de rester.'),
            ]);
            return finalize([h, e1]);
        },
    };

    const fn = sheets[key];
    if (!fn) return [buildHomeEmbed(botIconURL)];
    return fn();
}

function buildHelpPayload(categoryKey, client) {
    const botIconURL = getBotIconURL(client);
    const cat = resolveHelpCategory(categoryKey);
    const embeds = cat === 'home' ? [buildHomeEmbed(botIconURL)] : buildCategoryEmbeds(cat, botIconURL);
    return {
        embeds,
        components: [buildSelectRow(cat)],
    };
}

module.exports = {
    HELP_SELECT_ID,
    resolveHelpCategory,
    buildHelpPayload,
    buildSelectRow,
    getBotIconURL,
};
