const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require('discord.js');

const HELP_SELECT_ID = 'mayssou:help';

const PREFIX = (process.env.prefix || '+').trim() || '+';

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
    { value: 'home', label: 'Accueil', emoji: '🏠' },
    { value: 'moderation', label: 'Modération', emoji: '🛡️' },
    { value: 'config', label: 'Configuration', emoji: '⚙️' },
    { value: 'utility', label: 'Utilitaire', emoji: '🤓' },
    { value: 'music', label: 'Musique', emoji: '🎵' },
    { value: 'voice', label: 'Vocal', emoji: '🎙️' },
    { value: 'social', label: 'Social', emoji: '🤫' },
    { value: 'fun', label: 'Fun', emoji: '✨' },
    { value: 'server', label: 'Serveur', emoji: '🏛️' },
    { value: 'security', label: 'Sécurité bot', emoji: '🔐' },
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
            .setPlaceholder('Choisir une catégorie')
            .addOptions(
                CATEGORIES.map((c) => ({
                    label: c.label,
                    value: c.value,
                    emoji: c.emoji,
                    default: c.value === current,
                }))
            )
    );
}

function buildHomeEmbed() {
    const p = PREFIX;
    return new EmbedBuilder()
        .setTitle('🏠 Accueil')
        .setColor(0x5865f2)
        .setDescription(
            [
                `**Mayssou** — commandes en **\`/\`** (slash) ou préfixe **\`${p}\`**.`,
                '',
                `• Utilise **\`/help\`** ou **\`${p}help\`** pour ce panneau.`,
                `• **\`${p}help <catégorie>\`** — ex. \`${p}help moderation\`, \`${p}help server\`.`,
                '',
                '**Quelques liens utiles**',
                '• [Dépôt GitHub (Mayssou)](https://github.com/Impossibol04/Mayssou)',
                '',
                'Choisis une catégorie dans le menu ci-dessous.',
            ].join('\n')
        )
        .setFooter({ text: `Préfixe : ${p} • Slash : /` })
        .setTimestamp();
}

function buildCategoryEmbed(key) {
    const p = PREFIX;
    const slash = (name) => `\`/${name}\``;
    const pre = (name) => `\`${p}${name}\``;

    const sheets = {
        moderation: {
            title: '🛡️ Modération',
            body: [
                `${pre('clear')} / \`/clear\` — nombre (1–100)`,
                `${pre('warn')} / \`/warn\` — membre, raison`,
                `${pre('warnlist')} / \`/warnlist\` — liste des warns`,
                `${pre('cleanwarn')} / \`/cleanwarn\` — efface les warns (\`all\` = tout)`,
                `${pre('unmute')} / \`/unmute\` — retire le timeout`,
                `${pre('untimeout')} / \`/untimeout\` — idem`,
                `${pre('modnote')} / \`/modnote\` — notes staff (add/list/del)`,
                `${pre('slowmode')} / \`/slowmode\` — secondes`,
                `${pre('softban')} / \`/softban\` — purge messages puis déban`,
                `${pre('purgeuser')} / \`/purgeuser\` — supprime messages d’un membre`,
                `${pre('report')} / \`/report\` — signalement → modlogs`,
                `${pre('antiraid')} — pic d’arrivées + \`exempt @rôle\``,
                `${pre('kick')} / \`/kick\` • ${pre('ban')} / \`/ban\` • ${pre('unban')} / \`/unban\``,
                `${pre('banlist')} / \`/banlist\` — **liste** des bannis`,
                `${pre('banmass')} / \`/banmass\` — **ban massif** (confirmation)`,
                `${pre('timeout')} / \`/timeout\` — minutes`,
                `${pre('lock')} / \`/lock\` • ${pre('unlock')} / \`/unlock\``,
                `${pre('addrole')} / \`/addrole\` • ${pre('removerole')} / \`/removerole\``,
                `${pre('steal')} / \`/steal\` — emoji`,
                `${pre('settranslate')} — autorise ou non \`translate\` (Manage Server)`,
                `${pre('vmute')}, ${pre('vunmute')}, ${pre('vdeafen')}, ${pre('vundeafen')}, ${pre('vkick')}, ${pre('vmove')} + slash`,
            ].join('\n'),
        },
        config: {
            title: '⚙️ Configuration',
            body: [
                `${pre('setprefix')} — préfixe du serveur (admin)`,
                `${pre('language')} — \`fr\` / \`en\` (défaut **translate**, etc.)`,
                `${pre('setconfess')} / \`/setconfess\` — salon`,
                `${pre('setwelcome join|leave')} / \`/setwelcome\` — sous-commandes`,
                `${pre('setjoinvoice')} / \`/setjoinvoice\` — catégorie optionnelle`,
                `${pre('deletejoinvoice')} / \`/deletejoinvoice\``,
                `${pre('setmodlogs')} / \`/setmodlogs\` — salon des logs de modération`,
            ].join('\n'),
        },
        utility: {
            title: '🤓 Utilitaire',
            body: [
                `${pre('ping')} / \`/ping\``,
                `${pre('uptime')} / \`/uptime\``,
                `${pre('snipe')} / \`/snipe\``,
                `${pre('calc')} / \`/calc\``,
                `${pre('userinfo')} / \`/userinfo\``,
                `${pre('serverinfo')} / \`/serverinfo\``,
                `${pre('stats')} / \`/stats\``,
                `${pre('leaderboard')} — aussi \`${p}lb\`, \`${p}top\` / \`/leaderboard\``,
                `${pre('afk')} / \`/afk\` — message AFK`,
                `${pre('inviteinfo')} — staff (**Modérer** requis)`,
                `${pre('translate')} — tiers ; \`settranslate off\` pour couper`,
                `${pre('weather')} <ville>`,
                `${pre('setbirthday')} JJ/MM — rappel **#salon-système** (UTC)`,
                `${pre('ask')}, ${pre('summarize')} — staff + **OPENAI_API_KEY**`,
            ].join('\n'),
        },
        music: {
            title: '🎵 Musique',
            body: [
                `${pre('play')} / \`/play\` — karaoké option`,
                `${pre('nowplaying')} (${p}np) / \`/nowplaying\``,
                `${pre('volume')} / \`/volume\``,
                `${pre('shuffle')} / \`/shuffle\` • ${pre('remove')} / \`/remove\``,
                `${pre('skipto')} / \`/skipto\` • ${pre('seek')} / \`/seek\``,
                `${pre('replay')} / \`/replay\` • ${pre('autoplay')} / \`/autoplay\``,
                `${pre('lyrics')} / \`/lyrics\``,
                `${pre('skip')} / \`/skip\` • ${pre('stop')} / \`/stop\``,
                `${pre('pause')} / \`/pause\` • ${pre('queue')} (${p}q) / \`/queue\``,
                `${pre('loop')} / \`/loop\` • ${pre('leave')} / \`/leave\``,
            ].join('\n'),
        },
        voice: {
            title: '🎙️ Vocal',
            body: [
                '**Message privé** — dès que tu crées un vocal via le hub, le bot t’envoie un **panneau** (renom, limite, exclure, bloquer) **visible seulement par toi**. Active tes MP.',
                `${pre('tts')} / \`/tts\` — texte (dans un vocal)`,
                `${pre('voicename')} / \`/voicename\` — **vocal temporaire** dont tu es propriétaire`,
                `${pre('voicelimit')} / \`/voicelimit\` — limite + **boutons** sur le salon texte`,
                'Les vocaux temporaires viennent du hub **`setjoinvoice`**.',
            ].join('\n'),
        },
        social: {
            title: '🤫 Social',
            body: [
                `${pre('confess')} / \`/confess\` (salon configuré)`,
                `${pre('poll')} / \`/poll\``,
                `${pre('rep')} / \`/rep\` — +1 / jour / personne`,
            ].join('\n'),
        },
        fun: {
            title: '✨ Fun',
            body: [
                `${pre('8ball')} / ${slash('eightball')}`,
                `${pre('avatar')}, ${pre('banner')}, ${pre('love')}, ${pre('rate')}, ${pre('gay')}, ${pre('67')} + slash`,
                `${pre('level')} / \`/level\` — XP messages (cooldown)`,
                `${pre('ship')} / \`/ship\` — compatibilité aléatoire`,
                `Note : \`/sixseven\` = ${pre('67')}`,
            ].join('\n'),
        },
        server: {
            title: '🏛️ Serveur',
            body: [
                `${pre('audit')} / \`/audit\` — derniers audits (permission requise)`,
                `${pre('roleinfo')} / \`/roleinfo\``,
                `${pre('channelinfo')} / \`/channelinfo\``,
                `${pre('emojiinfo')} / \`/emojiinfo\` — emoji **du serveur**`,
            ].join('\n'),
        },
        security: {
            title: '🔐 Sécurité bot (owner)',
            body: [
                `Variable d’environnement **\`OWNER_ID\`** = ton ID Discord.`,
                `${pre('debug')} / \`/debug\` — état du bot`,
                `${pre('guildblacklist')} / \`/guildblacklist\` — add/remove/list serveurs interdits`,
            ].join('\n'),
        },
    };

    const sheet = sheets[key];
    if (!sheet) return buildHomeEmbed();

    return new EmbedBuilder()
        .setTitle(sheet.title)
        .setColor(0x2f3136)
        .setDescription(sheet.body)
        .setFooter({ text: `Retour : menu ci-dessous • ${p} ou /` })
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
