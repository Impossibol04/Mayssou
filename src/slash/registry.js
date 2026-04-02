const { SlashCommandBuilder, ChannelType, Collection } = require('discord.js');
const { buildHelpPayload, resolveHelpCategory } = require('../utils/helpPanel');

/**
 * Chaque entrée : commande / slash → même handler que le préfixe (via slashAdapter).
 * commandName doit correspondre au nom du fichier dans src/commands (sans alias).
 */
module.exports = [
    {
        data: new SlashCommandBuilder()
            .setName('help')
            .setDescription('Aide du bot (menu par catégorie)')
            .addStringOption((o) =>
                o.setName('categorie')
                    .setDescription('Ouvrir directement une rubrique')
                    .setRequired(false)
                    .addChoices(
                        { name: '🏠 Accueil', value: 'home' },
                        { name: '🛡️ Modération', value: 'moderation' },
                        { name: '⚙️ Configuration', value: 'config' },
                        { name: '🤓 Utilitaire', value: 'utility' },
                        { name: '🎵 Musique', value: 'music' },
                        { name: '🎙️ Vocal', value: 'voice' },
                        { name: '🤫 Social', value: 'social' },
                        { name: '✨ Fun', value: 'fun' }
                    )),
        customExecute: async (bot, interaction) => {
            const raw = interaction.options.getString('categorie');
            const cat = resolveHelpCategory(raw || 'home');
            await interaction.reply(buildHelpPayload(cat));
        },
    },
    {
        data: new SlashCommandBuilder().setName('ping').setDescription('Latence du bot'),
        commandName: 'ping',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('uptime').setDescription('Temps de fonctionnement du bot'),
        commandName: 'uptime',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('serverinfo').setDescription('Infos sur ce serveur'),
        commandName: 'serverinfo',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('userinfo').setDescription('Infos sur un membre')
            .addUserOption((o) => o.setName('membre').setDescription('Membre (toi par défaut)').setRequired(false)),
        commandName: 'userinfo',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('membre');
            if (!u) return {};
            const mem = await i.guild.members.fetch(u.id).catch(() => null);
            return {
                mentionUsers: new Collection([[u.id, u]]),
                mentionMembers: mem ? new Collection([[mem.id, mem]]) : new Collection(),
            };
        },
    },
    {
        data: new SlashCommandBuilder().setName('stats').setDescription('Carte de stats d’un membre')
            .addUserOption((o) => o.setName('membre').setDescription('Membre (toi par défaut)').setRequired(false)),
        commandName: 'stats',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('membre');
            if (!u) return {};
            const mem = await i.guild.members.fetch(u.id).catch(() => null);
            return {
                mentionUsers: new Collection([[u.id, u]]),
                mentionMembers: mem ? new Collection([[mem.id, mem]]) : new Collection(),
            };
        },
    },
    {
        data: new SlashCommandBuilder().setName('leaderboard').setDescription('Classement messages / vocal'),
        commandName: 'leaderboard',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('snipe').setDescription('Dernier message supprimé dans ce salon'),
        commandName: 'snipe',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('clear').setDescription('Supprimer des messages en masse')
            .addIntegerOption((o) => o.setName('nombre').setDescription('Entre 1 et 100').setRequired(true).setMinValue(1).setMaxValue(100)),
        commandName: 'clear',
        toArgs: (i) => [String(i.options.getInteger('nombre'))],
    },
    {
        data: new SlashCommandBuilder().setName('warn').setDescription('Avertir un membre')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
            .addStringOption((o) => o.setName('raison').setDescription('Raison').setRequired(false)),
        commandName: 'warn',
        toArgs: (i) => {
            const u = i.options.getUser('membre');
            const r = i.options.getString('raison') || 'Aucune raison précisée.';
            return [u.id, ...r.split(/\s+/)];
        },
    },
    {
        data: new SlashCommandBuilder().setName('kick').setDescription('Expulser un membre')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
            .addStringOption((o) => o.setName('raison').setDescription('Raison').setRequired(false)),
        commandName: 'kick',
        toArgs: (i) => {
            const u = i.options.getUser('membre');
            const r = i.options.getString('raison') || 'Aucune raison précisée.';
            return [u.id, ...r.split(/\s+/)];
        },
    },
    {
        data: new SlashCommandBuilder().setName('ban').setDescription('Bannir un membre')
            .addUserOption((o) => o.setName('membre').setDescription('Utilisateur').setRequired(true))
            .addStringOption((o) => o.setName('raison').setDescription('Raison').setRequired(false)),
        commandName: 'ban',
        toArgs: (i) => {
            const u = i.options.getUser('membre');
            const r = i.options.getString('raison') || 'Aucune raison précisée.';
            return [u.id, ...r.split(/\s+/)];
        },
    },
    {
        data: new SlashCommandBuilder().setName('unban').setDescription('Débannir par ID')
            .addUserOption((o) => o.setName('utilisateur').setDescription('Compte').setRequired(true)),
        commandName: 'unban',
        toArgs: (i) => [i.options.getUser('utilisateur').id],
    },
    {
        data: new SlashCommandBuilder().setName('timeout').setDescription('Exclure temporairement (timeout)')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
            .addIntegerOption((o) => o.setName('minutes').setDescription('Durée en minutes').setRequired(true).setMinValue(1).setMaxValue(40320)),
        commandName: 'timeout',
        toArgs: (i) => [i.options.getUser('membre').id, String(i.options.getInteger('minutes'))],
    },
    {
        data: new SlashCommandBuilder().setName('lock').setDescription('Verrouiller un salon texte')
            .addChannelOption((o) => o.setName('salon').setDescription('Salon (celui-ci par défaut)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(false)),
        commandName: 'lock',
        toArgs: (i) => {
            const c = i.options.getChannel('salon');
            return c ? [c.id] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('unlock').setDescription('Déverrouiller un salon texte')
            .addChannelOption((o) => o.setName('salon').setDescription('Salon (celui-ci par défaut)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(false)),
        commandName: 'unlock',
        toArgs: (i) => {
            const c = i.options.getChannel('salon');
            return c ? [c.id] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('addrole').setDescription('Ajouter un rôle à un membre')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
            .addRoleOption((o) => o.setName('role').setDescription('Rôle').setRequired(true)),
        commandName: 'addrole',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('membre');
            const r = i.options.getRole('role');
            return {
                mentionUsers: new Collection([[u.id, u]]),
                mentionRoles: new Collection([[r.id, r]]),
            };
        },
    },
    {
        data: new SlashCommandBuilder().setName('removerole').setDescription('Retirer un rôle à un membre')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
            .addRoleOption((o) => o.setName('role').setDescription('Rôle').setRequired(true)),
        commandName: 'removerole',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('membre');
            const r = i.options.getRole('role');
            return {
                mentionUsers: new Collection([[u.id, u]]),
                mentionRoles: new Collection([[r.id, r]]),
            };
        },
    },
    {
        data: new SlashCommandBuilder().setName('steal').setDescription('Ajouter un emoji au serveur')
            .addStringOption((o) => o.setName('emoji').setDescription('Emoji custom <a:name:id> ou ID numérique').setRequired(true))
            .addStringOption((o) => o.setName('nom').setDescription('Nom sur le serveur').setRequired(false)),
        commandName: 'steal',
        syntheticContent: (i) => i.options.getString('emoji') || '',
        toArgs: (i) => {
            const em = i.options.getString('emoji');
            const nom = i.options.getString('nom');
            return nom ? [em, nom] : [em];
        },
    },
    {
        data: new SlashCommandBuilder().setName('setconfess').setDescription('Définir le salon des confessions')
            .addChannelOption((o) => o.setName('salon').setDescription('Salon').addChannelTypes(ChannelType.GuildText).setRequired(false)),
        commandName: 'setconfess',
        toArgs: (i) => {
            const c = i.options.getChannel('salon');
            return c ? [c.id] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('setwelcome').setDescription('Salons bienvenue / départ')
            .addSubcommand((s) =>
                s.setName('join').setDescription('Salon des arrivées')
                    .addChannelOption((o) => o.setName('salon').setDescription('Salon texte').addChannelTypes(ChannelType.GuildText).setRequired(false)))
            .addSubcommand((s) =>
                s.setName('leave').setDescription('Salon des départs')
                    .addChannelOption((o) => o.setName('salon').setDescription('Salon texte').addChannelTypes(ChannelType.GuildText).setRequired(false))),
        commandName: 'setwelcome',
        toArgs: (i) => {
            const sub = i.options.getSubcommand();
            const ch = i.options.getChannel('salon');
            return ch ? [sub, ch.id] : [sub];
        },
    },
    {
        data: new SlashCommandBuilder().setName('setjoinvoice').setDescription('Créer le salon hub vocaux temporaires')
            .addChannelOption((o) => o.setName('categorie').setDescription('Catégorie parente').addChannelTypes(ChannelType.GuildCategory).setRequired(false)),
        commandName: 'setjoinvoice',
        toArgs: (i) => {
            const c = i.options.getChannel('categorie');
            return c ? [c.id] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('deletejoinvoice').setDescription('Supprimer le salon hub vocaux temporaires'),
        commandName: 'deletejoinvoice',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('vmute').setDescription('Mute vocal')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
        commandName: 'vmute',
        toArgs: (i) => [i.options.getUser('membre').id],
    },
    {
        data: new SlashCommandBuilder().setName('vunmute').setDescription('Unmute vocal')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
        commandName: 'vunmute',
        toArgs: (i) => [i.options.getUser('membre').id],
    },
    {
        data: new SlashCommandBuilder().setName('vdeafen').setDescription('Deafen vocal (sourd)')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
        commandName: 'vdeafen',
        toArgs: (i) => [i.options.getUser('membre').id],
    },
    {
        data: new SlashCommandBuilder().setName('vundeafen').setDescription('Undeafen vocal')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
        commandName: 'vundeafen',
        toArgs: (i) => [i.options.getUser('membre').id],
    },
    {
        data: new SlashCommandBuilder().setName('vkick').setDescription('Déconnecter du vocal')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
        commandName: 'vkick',
        toArgs: (i) => [i.options.getUser('membre').id],
    },
    {
        data: new SlashCommandBuilder().setName('vmove').setDescription('Déplacer un membre vers un vocal')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
            .addChannelOption((o) => o.setName('vocal').setDescription('Salon vocal').addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice).setRequired(true)),
        commandName: 'vmove',
        toArgs: (i) => [i.options.getUser('membre').id, i.options.getChannel('vocal').id],
    },
    {
        data: new SlashCommandBuilder().setName('play').setDescription('Jouer un morceau (SoundCloud)')
            .addStringOption((o) => o.setName('titre').setDescription('Titre ou recherche').setRequired(true))
            .addBooleanOption((o) => o.setName('karaoke').setDescription('Mode karaoké').setRequired(false)),
        commandName: 'play',
        toArgs: (i) => {
            const k = i.options.getBoolean('karaoke');
            const t = i.options.getString('titre');
            return k ? ['-k', t] : [t];
        },
    },
    {
        data: new SlashCommandBuilder().setName('skip').setDescription('Passer la piste en cours'),
        commandName: 'skip',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('stop').setDescription('Arrêter la musique'),
        commandName: 'stop',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('leave').setDescription('Quitter le vocal du bot'),
        commandName: 'leave',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('pause').setDescription('Pause / reprise de la lecture'),
        commandName: 'pause',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('loop').setDescription('Boucle la file ou la piste'),
        commandName: 'loop',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('queue').setDescription('File d’attente musique'),
        commandName: 'queue',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('tts').setDescription('Synthèse vocale dans ton salon')
            .addStringOption((o) => o.setName('texte').setDescription('Texte (max 1000 car.)').setRequired(true).setMaxLength(1000)),
        commandName: 'tts',
        toArgs: (i) => [i.options.getString('texte')],
    },
    {
        data: new SlashCommandBuilder().setName('voicename').setDescription('Renommer ton vocal temporaire')
            .addStringOption((o) => o.setName('nom').setDescription('Nouveau nom').setRequired(true).setMaxLength(32)),
        commandName: 'voicename',
        toArgs: (i) => [i.options.getString('nom')],
    },
    {
        data: new SlashCommandBuilder().setName('voicelimit').setDescription('Limite de places sur ton vocal temporaire')
            .addIntegerOption((o) => o.setName('nombre').setDescription('0 = illimité, max 99').setRequired(true).setMinValue(0).setMaxValue(99)),
        commandName: 'voicelimit',
        toArgs: (i) => [String(i.options.getInteger('nombre'))],
    },
    {
        data: new SlashCommandBuilder().setName('eightball').setDescription('Réponse aléatoire (8-ball)'),
        commandName: '8ball',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('avatar').setDescription('Avatar d’un membre')
            .addUserOption((o) => o.setName('utilisateur').setDescription('Utilisateur').setRequired(false)),
        commandName: 'avatar',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('utilisateur');
            if (!u) return {};
            return { mentionUsers: new Collection([[u.id, u]]) };
        },
    },
    {
        data: new SlashCommandBuilder().setName('banner').setDescription('Bannière d’un membre')
            .addUserOption((o) => o.setName('utilisateur').setDescription('Utilisateur').setRequired(false)),
        commandName: 'banner',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('utilisateur');
            if (!u) return {};
            return { mentionUsers: new Collection([[u.id, u]]) };
        },
    },
    {
        data: new SlashCommandBuilder().setName('love').setDescription('Compatibilité amoureuse')
            .addUserOption((o) => o.setName('membre').setDescription('Premier profil').setRequired(true))
            .addUserOption((o) => o.setName('avec').setDescription('Deuxième (toi si vide)').setRequired(false)),
        commandName: 'love',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const a = i.options.getUser('membre');
            const b = i.options.getUser('avec');
            const users = new Collection();
            if (b) {
                users.set(a.id, a);
                users.set(b.id, b);
            } else {
                users.set(i.user.id, i.user);
                users.set(a.id, a);
            }
            return { mentionUsers: users };
        },
    },
    {
        data: new SlashCommandBuilder().setName('rate').setDescription('Note quelque chose au hasard')
            .addStringOption((o) => o.setName('chose').setDescription('Ce qu’on note (vide = toi)').setRequired(false)),
        commandName: 'rate',
        toArgs: (i) => {
            const s = i.options.getString('chose');
            return s ? [s] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('gay').setDescription('Gayrate')
            .addUserOption((o) => o.setName('utilisateur').setDescription('Cible').setRequired(false)),
        commandName: 'gay',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('utilisateur');
            if (!u) return {};
            return { mentionUsers: new Collection([[u.id, u]]) };
        },
    },
    {
        data: new SlashCommandBuilder().setName('calc').setDescription('Calculatrice')
            .addStringOption((o) => o.setName('expression').setDescription('Ex: 2+2').setRequired(true)),
        commandName: 'calc',
        toArgs: (i) => [i.options.getString('expression')],
    },
    {
        data: new SlashCommandBuilder().setName('poll').setDescription('Créer un sondage oui/non')
            .addStringOption((o) => o.setName('question').setDescription('Question').setRequired(true)),
        commandName: 'poll',
        toArgs: (i) => [i.options.getString('question')],
    },
    {
        data: new SlashCommandBuilder().setName('confess').setDescription('Envoyer une confession (salon configuré)')
            .addStringOption((o) => o.setName('message').setDescription('Ta confession').setRequired(true)),
        commandName: 'confess',
        toArgs: (i) => [i.options.getString('message')],
    },
    {
        data: new SlashCommandBuilder().setName('sixseven').setDescription('Référence 6-7'),
        commandName: '67',
        toArgs: () => [],
    },
];
