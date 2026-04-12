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

/** Avatar GitHub (image profil, souvent mis en cache par Discord). */
const GITHUB_AVATAR = `${GITHUB_PROFILE}.png`;

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
    { value: 'home', label: 'Accueil', emoji: '🏠', desc: 'Vue d’ensemble & liens' },
    { value: 'moderation', label: 'Modération', emoji: '🛡️', desc: 'Staff & sanctions' },
    { value: 'config', label: 'Configuration', emoji: '⚙️', desc: 'Salons, préfixe…' },
    { value: 'utility', label: 'Utilitaire', emoji: '🤓', desc: 'Infos & outils' },
    { value: 'music', label: 'Musique', emoji: '🎵', desc: 'Lecture & file' },
    { value: 'voice', label: 'Vocal', emoji: '🎙️', desc: 'Hub & TTS' },
    { value: 'social', label: 'Social', emoji: '🤫', desc: 'Confess & co.' },
    { value: 'fun', label: 'Fun', emoji: '✨', desc: 'Jeux & détente' },
    { value: 'server', label: 'Serveur', emoji: '🏛️', desc: 'Audit & infos' },
    { value: 'security', label: 'Sécurité bot', emoji: '🔐', desc: 'Owner uniquement' },
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

function buildHomeEmbed() {
    const p = PREFIX;
    return new EmbedBuilder()
        .setColor(COLORS.home)
        .setAuthor({
            name: `Mayssou — par ${GITHUB_USER}`,
            iconURL: GITHUB_AVATAR,
            url: GITHUB_PROFILE,
        })
        .setTitle('✦ Centre d’aide')
        .setURL(GITHUB_REPO)
        .setThumbnail(GITHUB_AVATAR)
        .setDescription(
            [
                '*Toutes les commandes en **slash** (`/`) ou avec le **préfixe** ci-dessous.*',
                '',
                `**Préfixe actuel (ce serveur)** — \`${p}\``,
                '',
                '**Changer le préfixe**',
                `Les **administrateurs** peuvent définir un préfixe unique pour ce serveur : \`${p}setprefix !\` (ou \`.\`, \`?\`, etc.) et \`${p}setprefix reset\` pour revenir au défaut. Les slash **/** ne changent jamais.`,
                '',
                '**Liens**',
                `> [GitHub — **${GITHUB_USER}**](${GITHUB_PROFILE})`,
                `> [Dépôt **Mayssou**](${GITHUB_REPO})`,
                '',
                '**Raccourcis**',
                `• \`/help\` ou \`${p}help\` — ce panneau`,
                `• \`${p}help moderation\` — ouvre une catégorie directement`,
                '',
                '*Utilise le menu déroulant pour parcourir les commandes.*',
            ].join('\n')
        )
        .setFooter({
            text: `Mayssou · Slash / · Préfixe affiché : ${p}`,
        })
        .setTimestamp();
}

function buildCategoryEmbed(key) {
    const p = PREFIX;
    const slash = (name) => `\`/${name}\``;
    const pre = (name) => `\`${p}${name}\``;
    const color = COLORS[key] ?? COLORS.home;

    const sheets = {
        moderation: {
            title: '🛡️ Modération',
            subtitle: 'Outils staff — permissions Discord requises selon la commande.',
            body: [
                `${pre('clear')} / \`/clear\` — nombre (1–100)`,
                `${pre('warn')} / \`/warn\` — membre, raison`,
                `${pre('warnlist')} / \`/warnlist\` — **tous** les warns + pages · ou membre`,
                `${pre('cleanwarn')} / \`/cleanwarn\` — efface les warns (\`all\` = tout)`,
                `${pre('unmute')} / \`/unmute\` · ${pre('untimeout')} / \`/untimeout\` — fin timeout`,
                `${pre('modnote')} / \`/modnote\` — notes staff (add / list / del)`,
                `${pre('slowmode')} / \`/slowmode\` — secondes`,
                `${pre('softban')} / \`/softban\` — purge puis déban`,
                `${pre('purgeuser')} / \`/purgeuser\` — messages d’un membre`,
                `${pre('report')} / \`/report\` — signalement → modlogs`,
                `${pre('antiraid')} — pic d’arrivées · \`exempt @rôle\``,
                `${pre('kick')} / \`/kick\` · ${pre('ban')} / \`/ban\` · ${pre('unban')} / \`/unban\``,
                `${pre('banlist')} / \`/banlist\` — liste des bannis (pages + boutons)`,
                `${pre('banmass')} / \`/banmass\` — ban massif (confirmation)`,
                `${pre('timeout')} / \`/timeout\` — minutes`,
                `${pre('lock')} / \`/lock\` · ${pre('unlock')} / \`/unlock\``,
                `${pre('addrole')} / \`/addrole\` · ${pre('removerole')} / \`/removerole\``,
                `${pre('steal')} / \`/steal\` — emoji`,
                `${pre('settranslate')} — activer / couper \`translate\``,
                `${pre('vmute')}, ${pre('vunmute')}, ${pre('vdeafen')}, ${pre('vundeafen')}, ${pre('vkick')}, ${pre('vmove')} + slash`,
            ].join('\n'),
        },
        config: {
            title: '⚙️ Configuration',
            subtitle: 'Réservé aux rôles indiqués sur chaque commande.',
            body: [
                `**${pre('setprefix')}** — préfixe du serveur (admin) · \`reset\` pour défaut`,
                `${pre('language')} — \`fr\` / \`en\` (défaut translate, etc.)`,
                `${pre('setconfess')} / \`/setconfess\` — salon confessions`,
                `${pre('setwelcome join|leave')} / \`/setwelcome\``,
                `${pre('setjoinvoice')} / \`/setjoinvoice\` — hub vocaux temporaires`,
                `${pre('deletejoinvoice')} / \`/deletejoinvoice\``,
                `${pre('setmodlogs')} / \`/setmodlogs\` — logs modération`,
            ].join('\n'),
        },
        utility: {
            title: '🤓 Utilitaire',
            subtitle: 'Infos, outils du quotidien.',
            body: [
                `${pre('ping')} / \`/ping\` · ${pre('uptime')} / \`/uptime\``,
                `${pre('snipe')} / \`/snipe\` · ${pre('calc')} / \`/calc\``,
                `${pre('userinfo')} / \`/userinfo\` · ${pre('serverinfo')} / \`/serverinfo\``,
                `${pre('stats')} / \`/stats\` · ${pre('leaderboard')} · \`${p}lb\` · \`${p}top\``,
                `${pre('afk')} / \`/afk\``,
                `${pre('inviteinfo')} — staff (Modérer requis)`,
                `${pre('translate')} — tiers · \`settranslate off\``,
                `${pre('weather')} <ville>`,
                `${pre('setbirthday')} JJ/MM · ${pre('birthday')} / \`/birthday\``,
                `${pre('ask')}, ${pre('summarize')} — staff + \`OPENAI_API_KEY\``,
            ].join('\n'),
        },
        music: {
            title: '🎵 Musique',
            subtitle: 'SoundCloud — même salon vocal que le bot.',
            body: [
                `${pre('play')} / \`/play\` — option karaoké`,
                `${pre('nowplaying')} (${p}np) / \`/nowplaying\``,
                `${pre('volume')} · ${pre('shuffle')} · ${pre('remove')}`,
                `${pre('skipto')} · ${pre('seek')} · ${pre('replay')} · ${pre('autoplay')}`,
                `${pre('lyrics')} / \`/lyrics\``,
                `${pre('skip')} · ${pre('stop')} · ${pre('pause')} · ${pre('queue')} (${p}q)`,
                `${pre('loop')} · ${pre('leave')}`,
            ].join('\n'),
        },
        voice: {
            title: '🎙️ Vocal',
            subtitle: 'Hub temporaires & synthèse vocale.',
            body: [
                '**Panneau privé** — en créant un vocal via le hub, le bot t’envoie un panneau (MP).',
                `${pre('tts')} / \`/tts\``,
                `${pre('voicename')} / \`/voicename\` · ${pre('voicelimit')} / \`/voicelimit\``,
                'Hub : **`setjoinvoice`**',
            ].join('\n'),
        },
        social: {
            title: '🤫 Social',
            subtitle: 'Interactions légères.',
            body: [
                `${pre('confess')} / \`/confess\``,
                `${pre('poll')} / \`/poll\``,
                `${pre('rep')} / \`/rep\` — +1 / jour / personne`,
            ].join('\n'),
        },
        fun: {
            title: '✨ Fun',
            subtitle: 'Détente & mini-jeux.',
            body: [
                `${pre('8ball')} / ${slash('eightball')}`,
                `${pre('avatar')}, ${pre('banner')}, ${pre('love')}, ${pre('rate')}, ${pre('gay')}, ${pre('67')}`,
                `${pre('level')} / \`/level\` · ${pre('ship')} / \`/ship\``,
                `\`/sixseven\` = ${pre('67')}`,
            ].join('\n'),
        },
        server: {
            title: '🏛️ Serveur',
            subtitle: 'Audit & métadonnées.',
            body: [
                `${pre('audit')} / \`/audit\` — journal d’audit`,
                `${pre('roleinfo')} / \`/roleinfo\``,
                `${pre('channelinfo')} / \`/channelinfo\``,
                `${pre('emojiinfo')} / \`/emojiinfo\``,
            ].join('\n'),
        },
        security: {
            title: '🔐 Sécurité bot',
            subtitle: 'Réservé au propriétaire (`OWNER_ID`).',
            body: [
                `${pre('debug')} / \`/debug\` — état du bot`,
                `${pre('blacklist')} / \`/blacklist\` — serveurs interdits`,
            ].join('\n'),
        },
    };

    const sheet = sheets[key];
    if (!sheet) return buildHomeEmbed();

    const desc = `*${sheet.subtitle}*\n\n${sheet.body}`;

    return new EmbedBuilder()
        .setColor(color)
        .setAuthor({
            name: 'Mayssou · Aide',
            iconURL: GITHUB_AVATAR,
            url: GITHUB_REPO,
        })
        .setTitle(sheet.title)
        .setDescription(desc.slice(0, 4096))
        .setFooter({
            text: `Menu ci-dessous · ${p} ou / · ${GITHUB_USER}`,
        })
        .setTimestamp();
}

function buildHelpPayload(categoryKey) {
    const cat = resolveHelpCategory(categoryKey);
    const embed = cat === 'home' ? buildHomeEmbed() : buildCategoryEmbed(cat);
    return {
        embeds: [embed],
        components: [buildSelectRow(cat)],
    };
}

module.exports = {
    HELP_SELECT_ID,
    resolveHelpCategory,
    buildHelpPayload,
    buildSelectRow,
};
