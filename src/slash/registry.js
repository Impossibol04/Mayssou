const { SlashCommandBuilder, ChannelType, Collection } = require('discord.js');
const { buildHelpPayload, resolveHelpCategory } = require('../components/helpPanel');

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
                        { name: '✨ Fun', value: 'fun' },
                        { name: '🏛️ Serveur', value: 'server' },
                        { name: '🔐 Sécurité bot', value: 'security' }
                    )),
        customExecute: async (bot, interaction) => {
            const raw = interaction.options.getString('categorie');
            const cat = resolveHelpCategory(raw || 'home');
            await interaction.editReply(
                buildHelpPayload(cat, bot, { openerUserId: interaction.user.id, page: 0 })
            );
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
        data: new SlashCommandBuilder().setName('banmass').setDescription('Ban massif (max 5 cibles / slash, confirmation)')
            .addUserOption((o) => o.setName('cible1').setDescription('1er membre').setRequired(true))
            .addUserOption((o) => o.setName('cible2').setDescription('2ème membre').setRequired(false))
            .addUserOption((o) => o.setName('cible3').setDescription('3ème membre').setRequired(false))
            .addUserOption((o) => o.setName('cible4').setDescription('4ème membre').setRequired(false))
            .addUserOption((o) => o.setName('cible5').setDescription('5ème membre').setRequired(false))
            .addStringOption((o) => o.setName('raison').setDescription('Raison du ban').setRequired(false)),
        customExecute: async (bot, interaction) => {
            const cibleKeys = ['cible1', 'cible2', 'cible3', 'cible4', 'cible5'];
            const users = cibleKeys.map((k) => interaction.options.getUser(k)).filter(Boolean);

            const reason = interaction.options.getString('raison') || 'Mass Ban';

            if (users.length === 0)
                return interaction.followUp({ content: '❌ Aucun utilisateur valide.', ephemeral: true });

            const fakeArgs = [...users.map((u) => u.id), ...reason.split(' ')];

            const { Collection } = require('discord.js');
            const mentionUsers = new Collection(users.map((u) => [u.id, u]));

            const { createSlashMessageAdapter } = require('../utils/slashAdapter');
            const adapter = createSlashMessageAdapter(interaction, {
                syntheticContent: '',
                mentionUsers,
            });

            const cmd = bot.commands.get('banmass');
            if (cmd) await cmd(bot, adapter, fakeArgs);
        },
    },
    {
        data: new SlashCommandBuilder().setName('banlist').setDescription('Liste des bannissements (paginé + boutons)')
            .addIntegerOption((o) => o.setName('page').setDescription('Page (1 par défaut)').setRequired(false).setMinValue(1).setMaxValue(500)),
        commandName: 'banlist',
        toArgs: (i) => {
            const p = i.options.getInteger('page');
            return p ? [String(p)] : [];
        },
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
        data: new SlashCommandBuilder().setName('setmodlogs').setDescription('Définir le salon des logs de modération')
            .addChannelOption((o) => o.setName('salon').setDescription('Salon texte (celui-ci par défaut)').addChannelTypes(ChannelType.GuildText).setRequired(false)),
        commandName: 'setmodlogs',
        toArgs: (i) => {
            const c = i.options.getChannel('salon');
            return c ? [c.id] : [];
        },
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
        data: new SlashCommandBuilder().setName('join').setDescription('Rejoindre ton salon vocal (musique)'),
        commandName: 'join',
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
    {
        data: new SlashCommandBuilder().setName('unmute').setDescription('Retirer le timeout Discord')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
        commandName: 'unmute',
        toArgs: (i) => [i.options.getUser('membre').id],
    },
    {
        data: new SlashCommandBuilder().setName('cleanwarn').setDescription('Effacer les warns enregistrés')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(false))
            .addBooleanOption((o) => o.setName('tout').setDescription('Tout le serveur (owner / gérer serveur)').setRequired(false)),
        customExecute: async (bot, interaction) => {
            const all = interaction.options.getBoolean('tout');
            const u = interaction.options.getUser('membre');
            const { Collection } = require('discord.js');
            const { createSlashMessageAdapter } = require('../utils/slashAdapter');
            if (all) {
                const adapter = createSlashMessageAdapter(interaction, {});
                const cmd = bot.commands.get('cleanwarn');
                if (cmd) await cmd(bot, adapter, ['all']);
                return;
            }
            if (!u) {
                return interaction.followUp({ ephemeral: true, content: '❌ Choisis un membre ou active **tout**.' });
            }
            const mem = await interaction.guild.members.fetch(u.id).catch(() => null);
            const adapter = createSlashMessageAdapter(interaction, {
                mentionUsers: new Collection([[u.id, u]]),
                mentionMembers: mem ? new Collection([[mem.id, mem]]) : new Collection(),
            });
            const cmd = bot.commands.get('cleanwarn');
            if (cmd) await cmd(bot, adapter, [u.id]);
        },
    },
    {
        data: new SlashCommandBuilder().setName('antiraid').setDescription('Antiraid (admin)')
            .addStringOption((o) =>
                o.setName('action').setDescription('Sous-commande').setRequired(false).addChoices(
                    { name: 'status', value: 'status' },
                    { name: 'on', value: 'on' },
                    { name: 'off', value: 'off' }
                )),
        commandName: 'antiraid',
        toArgs: (i) => {
            const a = i.options.getString('action');
            return a ? [a] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('inviteinfo').setDescription('Statistiques des invitations du serveur'),
        commandName: 'inviteinfo',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('translate').setDescription('Traduire du texte')
            .addStringOption((o) => o.setName('texte').setDescription('Texte').setRequired(true).setMaxLength(2000))
            .addStringOption((o) =>
                o.setName('vers').setDescription('Langue cible').setRequired(false).addChoices(
                    { name: 'Anglais', value: 'en' },
                    { name: 'Français', value: 'fr' },
                    { name: 'Espagnol', value: 'es' },
                    { name: 'Allemand', value: 'de' }
                )),
        commandName: 'translate',
        toArgs: (i) => {
            const t = i.options.getString('vers');
            const text = i.options.getString('texte');
            return t ? [t, text] : [text];
        },
    },
    {
        data: new SlashCommandBuilder().setName('weather').setDescription('Météo par ville')
            .addStringOption((o) => o.setName('ville').setDescription('Ex. Paris').setRequired(true)),
        commandName: 'weather',
        toArgs: (i) => [i.options.getString('ville')],
    },
    {
        data: new SlashCommandBuilder().setName('nowplaying').setDescription('Piste en cours'),
        commandName: 'nowplaying',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('volume').setDescription('Volume musique (0–200)')
            .addIntegerOption((o) => o.setName('niveau').setDescription('Vide = afficher').setRequired(false).setMinValue(0).setMaxValue(200)),
        commandName: 'volume',
        toArgs: (i) => {
            const n = i.options.getInteger('niveau');
            return n == null ? [] : [String(n)];
        },
    },
    {
        data: new SlashCommandBuilder().setName('shuffle').setDescription('Mélanger la file musique'),
        commandName: 'shuffle',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('remove').setDescription('Retirer un morceau de la file')
            .addIntegerOption((o) => o.setName('position').setDescription('Index 1 = prochain').setRequired(true).setMinValue(1).setMaxValue(100)),
        commandName: 'remove',
        toArgs: (i) => [String(i.options.getInteger('position'))],
    },
    {
        data: new SlashCommandBuilder().setName('seek').setDescription('Avance la lecture (secondes)')
            .addIntegerOption((o) => o.setName('secondes').setDescription('Position en secondes').setRequired(true).setMinValue(0).setMaxValue(36000)),
        commandName: 'seek',
        toArgs: (i) => [String(i.options.getInteger('secondes'))],
    },
    {
        data: new SlashCommandBuilder().setName('lyrics').setDescription('Paroles (Genius)')
            .addStringOption((o) => o.setName('titre').setDescription('Titre - Artiste (optionnel)').setRequired(false).setMaxLength(200)),
        commandName: 'lyrics',
        toArgs: (i) => {
            const t = i.options.getString('titre');
            return t ? [t] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('setprefix').setDescription('Préfixe du serveur (admin)')
            .addStringOption((o) => o.setName('prefix').setDescription('Nouveau préfixe ou reset').setRequired(false).setMaxLength(8)),
        commandName: 'setprefix',
        toArgs: (i) => {
            const p = i.options.getString('prefix');
            return p ? [p] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('setbirthday').setDescription('Enregistrer ton anniversaire (jour/mois)')
            .addStringOption((o) => o.setName('date').setDescription('JJ/MM').setRequired(false)),
        commandName: 'setbirthday',
        toArgs: (i) => {
            const d = i.options.getString('date');
            return d ? [d] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('language').setDescription('Langue du serveur (fr/en)')
            .addStringOption((o) =>
                o.setName('code').setDescription('Code').setRequired(false).addChoices(
                    { name: 'Français', value: 'fr' },
                    { name: 'English', value: 'en' }
                )),
        commandName: 'language',
        toArgs: (i) => {
            const c = i.options.getString('code');
            return c ? [c] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('ask').setDescription('Question à l’IA (OpenAI)')
            .addStringOption((o) => o.setName('question').setDescription('Ta question').setRequired(true).setMaxLength(1500)),
        commandName: 'ask',
        toArgs: (i) => [i.options.getString('question')],
    },
    {
        data: new SlashCommandBuilder().setName('summarize').setDescription('Résumer du texte (OpenAI)')
            .addStringOption((o) => o.setName('texte').setDescription('Texte à résumer').setRequired(false).setMaxLength(4000)),
        commandName: 'summarize',
        toArgs: (i) => {
            const t = i.options.getString('texte');
            return t ? [t] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('warnlist').setDescription('Liste des warns (serveur ou membre)')
            .addUserOption((o) => o.setName('membre').setDescription('Détail d’un membre (vide = tout le serveur)').setRequired(false))
            .addIntegerOption((o) => o.setName('page').setDescription('Numéro de page (1+)').setRequired(false).setMinValue(1).setMaxValue(500)),
        commandName: 'warnlist',
        toArgs: (i) => {
            const u = i.options.getUser('membre');
            const p = i.options.getInteger('page');
            if (u) return p ? [u.id, String(p)] : [u.id];
            return p ? [String(p)] : [];
        },
        enrichMentions: async (i) => {
            const u = i.options.getUser('membre');
            if (!u) return {};
            return { mentionUsers: new Collection([[u.id, u]]) };
        },
    },
    {
        data: new SlashCommandBuilder().setName('modnote').setDescription('Notes modération')
            .addStringOption((o) =>
                o.setName('action').setDescription('Action').setRequired(true).addChoices(
                    { name: 'Ajouter', value: 'add' },
                    { name: 'Lister', value: 'list' },
                    { name: 'Supprimer', value: 'del' }
                ))
            .addUserOption((o) => o.setName('membre').setDescription('Membre (add/list)').setRequired(false))
            .addStringOption((o) => o.setName('texte').setDescription('Texte (add)').setRequired(false).setMaxLength(900))
            .addStringOption((o) => o.setName('id_note').setDescription('ID note (del)').setRequired(false)),
        commandName: 'modnote',
        toArgs: (i) => {
            const a = i.options.getString('action');
            const u = i.options.getUser('membre');
            const t = i.options.getString('texte');
            const id = i.options.getString('id_note');
            if (a === 'add') return u && t ? ['add', u.id, t] : ['add'];
            if (a === 'list') return u ? ['list', u.id] : ['list'];
            return id ? ['del', id] : ['del'];
        },
    },
    {
        data: new SlashCommandBuilder().setName('slowmode').setDescription('Slowmode du salon (secondes)')
            .addIntegerOption((o) => o.setName('secondes').setDescription('0–21600').setRequired(true).setMinValue(0).setMaxValue(21600)),
        commandName: 'slowmode',
        toArgs: (i) => [String(i.options.getInteger('secondes'))],
    },
    {
        data: new SlashCommandBuilder().setName('softban').setDescription('Softban (purge puis déban)')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
            .addStringOption((o) => o.setName('raison').setDescription('Raison').setRequired(false)),
        commandName: 'softban',
        toArgs: (i) => {
            const u = i.options.getUser('membre');
            const r = i.options.getString('raison') || '';
            return [u.id, ...r.split(/\s+/).filter(Boolean)];
        },
    },
    {
        data: new SlashCommandBuilder().setName('untimeout').setDescription('Retirer le timeout (alias unmute)')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true)),
        commandName: 'untimeout',
        toArgs: (i) => [i.options.getUser('membre').id],
    },
    {
        data: new SlashCommandBuilder().setName('purgeuser').setDescription('Supprimer les messages d’un membre (récent)')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(true))
            .addIntegerOption((o) => o.setName('max').setDescription('Max à tenter (défaut 50)').setRequired(false).setMinValue(1).setMaxValue(500)),
        commandName: 'purgeuser',
        toArgs: (i) => {
            const u = i.options.getUser('membre');
            const m = i.options.getInteger('max');
            return m ? [u.id, String(m)] : [u.id];
        },
    },
    {
        data: new SlashCommandBuilder().setName('report').setDescription('Signaler au staff (salon modlogs)')
            .addStringOption((o) => o.setName('details').setDescription('Explication').setRequired(true).setMaxLength(900)),
        commandName: 'report',
        toArgs: (i) => [i.options.getString('details')],
    },
    {
        data: new SlashCommandBuilder().setName('audit').setDescription('Aperçu du journal d’audit')
            .addIntegerOption((o) => o.setName('nombre').setDescription('5–25').setRequired(false).setMinValue(5).setMaxValue(25)),
        commandName: 'audit',
        toArgs: (i) => {
            const n = i.options.getInteger('nombre');
            return n ? [String(n)] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('roleinfo').setDescription('Infos sur un rôle')
            .addRoleOption((o) => o.setName('role').setDescription('Rôle').setRequired(false)),
        commandName: 'roleinfo',
        toArgs: (i) => {
            const r = i.options.getRole('role');
            return r ? [r.id] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('channelinfo').setDescription('Infos sur un salon')
            .addChannelOption((o) => o.setName('salon').setDescription('Salon').setRequired(false)),
        commandName: 'channelinfo',
        toArgs: (i) => {
            const c = i.options.getChannel('salon');
            return c ? [c.id] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('emojiinfo').setDescription('Infos sur un emoji du serveur')
            .addStringOption((o) => o.setName('emoji').setDescription('Emoji ou nom').setRequired(true)),
        commandName: 'emojiinfo',
        toArgs: (i) => [i.options.getString('emoji')],
    },
    {
        data: new SlashCommandBuilder().setName('afk').setDescription('Mode AFK')
            .addStringOption((o) => o.setName('raison').setDescription('Message (optionnel)').setRequired(false).setMaxLength(200)),
        commandName: 'afk',
        toArgs: (i) => {
            const r = i.options.getString('raison');
            return r ? [r] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('skipto').setDescription('Sauter à une position dans la file')
            .addIntegerOption((o) => o.setName('position').setDescription('Index dans la file').setRequired(true).setMinValue(1).setMaxValue(100)),
        commandName: 'skipto',
        toArgs: (i) => [String(i.options.getInteger('position'))],
    },
    {
        data: new SlashCommandBuilder().setName('replay').setDescription('Rejouer la piste depuis le début'),
        commandName: 'replay',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('autoplay').setDescription('Autoplay SoundCloud on/off')
            .addStringOption((o) =>
                o.setName('etat').setDescription('État').setRequired(false).addChoices(
                    { name: 'Activer', value: 'on' },
                    { name: 'Désactiver', value: 'off' }
                )),
        commandName: 'autoplay',
        toArgs: (i) => {
            const e = i.options.getString('etat');
            return e ? [e] : [];
        },
    },
    {
        data: new SlashCommandBuilder().setName('level').setDescription('Niveau / XP')
            .addUserOption((o) => o.setName('membre').setDescription('Membre').setRequired(false)),
        commandName: 'level',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('membre');
            if (!u) return {};
            return { mentionUsers: new Collection([[u.id, u]]) };
        },
    },
    {
        data: new SlashCommandBuilder().setName('rep').setDescription('Donner ou voir des rep')
            .addUserOption((o) => o.setName('membre').setDescription('+1 rep (vide = ton total)').setRequired(false)),
        commandName: 'rep',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const u = i.options.getUser('membre');
            if (!u) return {};
            return { mentionUsers: new Collection([[u.id, u]]) };
        },
    },
    {
        data: new SlashCommandBuilder().setName('ship').setDescription('Compatibilité fun')
            .addUserOption((o) => o.setName('a').setDescription('Premier').setRequired(false))
            .addUserOption((o) => o.setName('b').setDescription('Deuxième').setRequired(false)),
        commandName: 'ship',
        toArgs: () => [],
        enrichMentions: async (i) => {
            const a = i.options.getUser('a');
            const b = i.options.getUser('b');
            const users = new Collection();
            if (a) users.set(a.id, a);
            if (b) users.set(b.id, b);
            return { mentionUsers: users };
        },
    },
    {
        data: new SlashCommandBuilder().setName('debug').setDescription('Infos debug (propriétaire bot)'),
        commandName: 'debug',
        toArgs: () => [],
    },
    {
        data: new SlashCommandBuilder().setName('blacklist').setDescription('Blacklist serveurs (propriétaire du bot)')
            .addStringOption((o) =>
                o.setName('action').setDescription('Action').setRequired(false).addChoices(
                    { name: 'Lister', value: 'list' },
                    { name: 'Ajouter', value: 'add' },
                    { name: 'Retirer', value: 'remove' }
                ))
            .addStringOption((o) => o.setName('id_serveur').setDescription('ID Discord du serveur').setRequired(false)),
        commandName: 'blacklist',
        toArgs: (i) => {
            const a = i.options.getString('action') || 'list';
            const id = i.options.getString('id_serveur');
            return id ? [a, id] : [a];
        },
    },
    {
        data: new SlashCommandBuilder().setName('settranslate').setDescription('Activer/désactiver translate (Manage Server)')
            .addBooleanOption((o) => o.setName('actif').setDescription('true = translate autorisé').setRequired(true)),
        commandName: 'settranslate',
        toArgs: (i) => [i.options.getBoolean('actif') ? 'on' : 'off'],
    },
    {
        data: new SlashCommandBuilder().setName('birthday').setDescription('Voir les anniversaires enregistrés sur le serveur'),
        commandName: 'birthday',
        toArgs: () => [],
    },
];