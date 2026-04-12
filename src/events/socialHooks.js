const { resolvePrefix } = require('../utils/prefix');
const { clearAfk, getAfk } = require('../utils/afkStore');
const { addXpMessage } = require('../utils/statsDB');

module.exports = (bot) => {
    bot.on('messageCreate', async (message) => {
        try {
            if (!message.guild || message.author.bot) return;

            const prefix = resolvePrefix(message.guild);
            const isCommand = message.content.startsWith(prefix);

            clearAfk(message.guild.id, message.author.id);

            if (!isCommand) {
                addXpMessage(message.guild.id, message.author.id);
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
        } catch (e) {
            console.error('[socialHooks]', e);
        }
    });
};
