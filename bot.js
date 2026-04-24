const { 
    Client, 
    GatewayIntentBits, 
    ActivityType, 
    Collection
} = require("discord.js");
const playdl = require('play-dl');
const fs = require('fs');
//const config = require("./config.json");

// pour le deployement du bot sur railway ou d'autre service
const config = {
    token: process.env.token,
    prefix: process.env.prefix
};

const path = require('path');
const { addMessage, addXpMessage } = require('./src/utils/statsDB');
const { checkCooldown } = require('./src/utils/cooldown');
const { defaultPrefix, resolvePrefix } = require('./src/utils/prefix');
const { runAutoModeration } = require('./src/utils/autoModeration');
const { clearAfk, getAfk } = require('./src/utils/afkStore');
const { syncXpRoles } = require('./src/utils/xpRoleSync');
const { addClanXpFromActivity } = require('./src/utils/clanStore');
const log = require('./src/utils/logger');
const { schedulePendingGiveaways } = require('./src/utils/giveawayRunner');

const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// --- SOUNDCLOUD SETUP ---
async function initSoundCloud() {
    try {
        const clientId = await playdl.getFreeClientID();
        if (!clientId) throw new Error("Client ID undefined");
        await playdl.setToken({ soundcloud: { client_id: clientId } });
        console.log("✅ SoundCloud initialisé");
    } catch (err) {
        console.error("⚠️ SoundCloud init échoué, retry dans 30s:", err.message);
        setTimeout(initSoundCloud, 30 * 1000);
    }
}

// --- SYSTÈME DE COMMANDES ---
bot.commands = new Collection();

const loadCommands = (dir) => {
    const files = fs.readdirSync(path.join(__dirname, dir));
    for (const file of files) {
        const stat = fs.lstatSync(path.join(__dirname, dir, file));
        if (stat.isDirectory()) {
            loadCommands(path.join(dir, file));
        } else if (file.endsWith(".js")) {
            const command = require(path.join(__dirname, dir, file));
            const commandName = file.split(".")[0];
            
            // 💡 ASTUCE : On force l'ajout du nom de la commande dans l'objet pour s'en resservir plus tard
            if (!command.name) command.name = commandName;

            bot.commands.set(commandName, command);
            console.log(`✅ Commande chargée : ${commandName}`);
            
            if (command.aliases) {
                for (const alias of command.aliases) {
                    bot.commands.set(alias, command);
                    console.log(`   ↳ Alias chargé : ${alias}`);
                }
            }
        }
    }
};

loadCommands('src/commands');

// --- CHARGEMENT DES EVENTS ---
const loadEvents = () => {
    const files = fs.readdirSync(path.join(__dirname, 'src/events')).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const event = require(path.join(__dirname, 'src/events', file));
        event(bot);
        console.log(`✅ Event chargé : ${file}`);
    }
};

loadEvents();

// Fonction pour restaurer les salons hubs au démarrage
//const restoreHubChannels = (client) => {
//    const dataPath = path.join(__dirname, './data_db/voiceChannels.json');
//    try {
//        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
//        for (const [guildId, { type, id }] of Object.entries(data)) {
//            const guild = client.guilds.cache.get(guildId);
//            if (guild && type === 'hub') {
//                const channel = guild.channels.cache.get(id);
//               if (!channel) {
//                    // Supprime l'entrée si le salon n'existe plus
//                    delete data[guildId];
//                    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
//                }
//            }
//        }
//    } catch (err) {
//        console.log('Aucun salon hub à restaurer.');
//    }
//};

bot.once("ready", () => {
    initSoundCloud();
    setInterval(initSoundCloud, 60 * 60 * 1000);

    const { listIds } = require('./src/utils/guildBlacklist');
    for (const gid of listIds()) {
        const g = bot.guilds.cache.get(gid);
        if (g) g.leave().catch(() => {});
    }

    console.log(`
  ███╗   ███╗ █████╗ ██╗   ██╗███████╗███████╗ ██████╗ ██╗   ██╗
  ████╗ ████║██╔══██╗╚██╗ ██╔╝██╔════╝██╔════╝██╔═══██╗██║   ██║
  ██╔████╔██║███████║ ╚████╔╝ ███████╗███████╗██║   ██║██║   ██║
  ██║╚██╔╝██║██╔══██║  ╚██╔╝  ╚════██║╚════██║██║   ██║██║   ██║
  ██║ ╚═╝ ██║██║  ██║   ██║   ███████║███████║╚██████╔╝╚██████╔╝
  ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚══════╝ ╚═════╝  ╚═════╝ 

  ✅ Bot opérationnel : ${bot.user.tag}
  👤 Nom du projet : Mayssou
  👤 Développé par : Helios_004
  `);
    bot.user.setPresence({
        activities: [{ name: `Mange du Popcorn | /help • ${defaultPrefix()}help`, type: ActivityType.Watching }],
        status: 'online',
    });

    schedulePendingGiveaways(bot);
    log.info('Giveaways actifs reprogrammés');
});

bot.on('error', (error) => console.error('Discord client error:', error));
bot.on('warn', (warning) => console.warn('Discord warning:', warning));

process.on('unhandledRejection', (reason) => console.error('Rejet non catché:', reason));
process.on('uncaughtException', (err) => console.error('Exception non catchée:', err));

bot.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('music_')) return;

    // On récupère les données musicales (ajuste le chemin si besoin)
    const { musicData, playNext } = require('./src/utils/musicManager');
    const data = musicData.get(interaction.guildId);

    if (!data) return interaction.reply({ content: "⚠️ Aucune musique en cours.", ephemeral: true });

    // Vérification : l'utilisateur est-il dans le même vocal ?
    const vc = interaction.member.voice.channel;
    const botVc = interaction.guild.members.me?.voice?.channel;
    if (!vc || !botVc || vc.id !== botVc.id) {
        return interaction.reply({ content: "❌ Tu dois être dans le même salon vocal !", ephemeral: true });
    }

    // On exécute l'action selon l'ID du bouton
    try {
        switch (interaction.customId) {
            case 'music_pause':
                const pauseCmd = require('./src/commands/music/pause');
                await pauseCmd(bot, interaction, []); // On simule l'appel à pause.js
                break;

            case 'music_skip':
                const skipCmd = require('./src/commands/music/skip');
                await skipCmd(bot, interaction, []);
                break;

            case 'music_stop':
                const stopCmd = require('./src/commands/music/stop');
                await stopCmd(bot, interaction, []);
                return interaction.message.delete().catch(() => {}); // On supprime le panel à l'arrêt

            case 'music_shuffle':
                const shuffleCmd = require('./src/commands/music/shuffle');
                await shuffleCmd(bot, interaction, []);
                break;

            case 'music_loop':
                const loopCmd = require('./src/commands/music/loop');
                await loopCmd(bot, interaction, []);
                break;

            case 'music_autoplay':
                const autoplayCmd = require('./src/commands/music/autoplay');
                await autoplayCmd(bot, interaction, []);
                break;

            case 'music_replay':
                const replayCmd = require('./src/commands/music/replay');
                await replayCmd(bot, interaction, []);
                break;
                
            case 'music_queue':
                const queueCmd = require('./src/commands/music/queue');
                await queueCmd(bot, interaction, []);
                break;
        }

        // Optionnel : On met à jour l'embed du panel pour refléter les changements (Loop On/Off, etc.)
        // await interaction.editReply(createMusicPanel(data)); 

    } catch (error) {
        console.error("Erreur bouton:", error);
        if (!interaction.replied) await interaction.reply({ content: "❌ Erreur lors de l'action.", ephemeral: true });
    }
});

bot.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.guild) {
        const blocked = await runAutoModeration(message);
        if (blocked) return;

        addMessage(message.guild.id, message.author.id, message.channel.id);

        const prefix = resolvePrefix(message.guild);
        const isCommand = message.content.startsWith(prefix);

        clearAfk(message.guild.id, message.author.id);

        if (!isCommand) {
            const xpRes = addXpMessage(message.guild.id, message.author.id);
            if (xpRes?.gain) {
                addClanXpFromActivity(message.guild.id, message.author.id, xpRes.gain);
            }
            if (xpRes?.leveledUp) {
                const mem = await message.guild.members.fetch(message.author.id).catch(() => null);
                if (mem) await syncXpRoles(mem, xpRes.level).catch(() => {});
            }
        }

        const firstMention = !isCommand ? message.mentions.users.first() : null;
        if (firstMention) {
            const a = getAfk(message.guild.id, firstMention.id);
            if (a && firstMention.id !== message.author.id) {
                await message.channel
                    .send({
                        content: `💤 **${firstMention.username}** est AFK : ${a.reason} — <t:${Math.floor(a.at / 1000)}:R>`,
                        allowedMentions: { users: [] },
                    })
                    .catch(() => {});
            }
        }
    }

    const prefix = resolvePrefix(message.guild);
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    const command = bot.commands.get(commandName);
    
    if (command) {
        const realCommandName = command.name || commandName;

        // --- CONFIGURATION DU COOLDOWN UNIVERSEL ---
        // On prend 3 secondes par défaut pour TOUTES les commandes.
        // Si tu ajoutes "cooldown: 10" dans un fichier de commande, il prendra 10 à la place.
        const cooldownAmount = command.cooldown !== undefined ? command.cooldown : 3; 

        // On vérifie le cooldown en passant le temps calculé
        const remaining = checkCooldown(realCommandName, message.author.id, cooldownAmount);
        
        if (remaining) {
            return message.reply(`⏳ Attends encore **${remaining}s** avant de refaire \`${prefix}${realCommandName}\`.`);
        }
        // --------------------------------------------

        if (command.expensiveCooldown) {
            const er = checkCooldown(`${realCommandName}:api`, message.author.id, command.expensiveCooldown);
            if (er) {
                return message.reply(`⏳ Cooldown **API** : encore **${er}s** avant \`${prefix}${realCommandName}\`.`);
            }
        }

        try {
            // Exécution de la commande (gère les fonctions simples ou les objets avec .run)
            if (typeof command === 'function') {
                await command(bot, message, args);
            } else if (command.run) {
                await command.run(bot, message, args);
            }
        } catch (error) {
            log.error(`commande ${realCommandName}`, { err: error?.message || String(error), guild: message.guild?.id });
            console.error(error);
            message.reply({ content: '❌ Une erreur est survenue dans cette commande.' }).catch(() => {});
        }
    }
});

if (!config.token) {
    console.error('❌ Variable d’environnement **token** manquante. Arrêt.');
    process.exit(1);
}

bot.login(config.token);