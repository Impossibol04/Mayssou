const { addMessage } = require('../utils/statsDB');
const { ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const LAST_BOOT_FILE = path.join(__dirname, '../../data_db/lastBoot.json');

function getLastBoot() {
    try {
        if (!fs.existsSync(LAST_BOOT_FILE)) return null;
        return JSON.parse(fs.readFileSync(LAST_BOOT_FILE, 'utf-8')).timestamp;
    } catch { return null; }
}

function saveLastBoot() {
    const dir = path.dirname(LAST_BOOT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LAST_BOOT_FILE, JSON.stringify({ timestamp: Date.now() }));
}

module.exports = (bot) => {
    bot.once('ready', async () => {
        setTimeout(async () => {
            const lastBoot = getLastBoot();

            if (!lastBoot) {
                console.log("⏭️ Premier démarrage, pas de récupération de messages.");
                saveLastBoot();
                return;
            }

            console.log(`🔄 Récupération des messages depuis le ${new Date(lastBoot).toLocaleString('fr-FR')}...`);
            let total = 0;

            for (const guild of bot.guilds.cache.values()) {
                const textChannels = guild.channels.cache.filter(c =>
                    c.type === ChannelType.GuildText && c.viewable
                );

                for (const [, channel] of textChannels) {
                    try {
                        const messages = await channel.messages.fetch({ limit: 100 });

                        for (const [, msg] of messages) {
                            if (msg.author.bot) continue;
                            // Prend seulement les messages depuis le dernier démarrage
                            if (msg.createdTimestamp <= lastBoot) continue;
                            addMessage(guild.id, msg.author.id, channel.id);
                            total++;
                        }
                    } catch { continue; }
                }
            }

            console.log(`✅ ${total} messages récupérés depuis le dernier démarrage !`);
            saveLastBoot();
        }, 3000);
    });
};