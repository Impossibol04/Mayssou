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
const { addMessage } = require('./src/utils/statsDB');
const { checkCooldown } = require('./src/utils/cooldown');

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

bot.once("ready", () => {
    initSoundCloud();
    setInterval(initSoundCloud, 60 * 60 * 1000);

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
        activities: [{ name: `Mange du Popcorn | /help • ${config.prefix}help`, type: ActivityType.Watching }],
        status: 'online',
    });
});

bot.on('error', (error) => console.error('Discord client error:', error));
bot.on('warn', (warning) => console.warn('Discord warning:', warning));

process.on('unhandledRejection', (reason) => console.error('Rejet non catché:', reason));
process.on('uncaughtException', (err) => console.error('Exception non catchée:', err));

bot.on("messageCreate", async (message) => {
    if (!message.author.bot && message.guild) {
        addMessage(message.guild.id, message.author.id, message.channel.id);
    }
    
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
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
            return message.reply(`⏳ Attends encore **${remaining}s** avant de refaire \`${config.prefix}${realCommandName}\`.`);
        }
        // --------------------------------------------
        
        try {
            // Exécution de la commande (gère les fonctions simples ou les objets avec .run)
            if (typeof command === 'function') {
                await command(bot, message, args);
            } else if (command.run) {
                await command.run(bot, message, args);
            }
        } catch (error) {
            console.error(error);
            message.reply("❌ Une erreur est survenue dans cette commande.");
        }
    }
});

bot.login(config.token);