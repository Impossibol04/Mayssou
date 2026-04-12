const { isBlacklisted } = require('../utils/guildBlacklist');

module.exports = (bot) => {
    bot.on('guildCreate', async (guild) => {
        if (!isBlacklisted(guild.id)) return;
        try {
            await guild.leave();
            console.log(`[blacklist] Quitté serveur refusé : ${guild.id}`);
        } catch (e) {
            console.error('[blacklist]', e.message);
        }
    });
};
