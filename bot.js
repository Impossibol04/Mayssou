// ==============================
// 📦 IMPORTS & CONFIGURATION
// ==============================
const { 
    Client, 
    GatewayIntentBits, 
    ActivityType, 
    Collection
} = require("discord.js");

const playdl = require('play-dl');
const fs = require('fs');
const config = require("./config.json");
const path = require('path');

// Initialisation du Bot
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
(async () => {
    const clientId = await playdl.getFreeClientID();
    await playdl.setToken({ soundcloud: { client_id: clientId } });
    console.log("✅ SoundCloud initialisé");
})();

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

// --- SNIPE ---
bot.snipes = new Map();
bot.on("messageDelete", (message) => {
    if (!message.author || message.author.bot) return;
    bot.snipes.set(message.channel.id, {
        content: message.content,
        author: message.author,
        date: new Date(),
        image: message.attachments.first()?.url || null
    });
});

// ==============================
// 🟢 ÉVÈNEMENTS DE BASE
// ==============================
bot.once("ready", () => {
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
    activities: [{ name: `Mange du Popcorn | ${config.prefix}help`, type: ActivityType.Watching }],
    status: 'online',
  });
});

// --- ÉCOUTEUR DE MESSAGES ---
bot.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = bot.commands.get(commandName);

    if (command) {
        try {
            await command(bot, message, args);
        } catch (error) {
            console.error(error);
            message.reply("❌ Une erreur est survenue dans cette commande.");
        }
    }
});

bot.login(config.token);