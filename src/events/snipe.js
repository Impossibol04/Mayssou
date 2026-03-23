module.exports = (bot) => {
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
};