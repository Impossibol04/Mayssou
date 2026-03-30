module.exports = (bot) => {
    bot.snipes = new Map();

    bot.on("messageDelete", (message) => {
        if (!message.author || message.author.bot) return;

        // On vérifie s'il y a une image uploadée
        let image = message.attachments.first()?.url || null;

        // Si pas d'image uploadée, on regarde si le texte contient un lien finit par .gif, .png ou .jpg
        if (!image && message.content.match(/\.(visuals|gif|jpg|jpeg|png|webp)/i)) {
            image = message.content;
        }

        bot.snipes.set(message.channel.id, {
            content: message.content,
            author: message.author,
            date: new Date(),
            image: image // On stocke l'URL ici
        });
    });
};