module.exports = async (client, message, args) => {
    const expression = args.join("");
    if (!expression) return message.reply("⚠️ Utilisation : `+calc 2+2`");
    try {
        const result = eval(expression.replace(/[^-()\d/*+.]/g, ''));
        message.reply(`🔢 Résultat : \`${result}\``);
    } catch {
        message.reply("❌ Erreur de calcul.");
    }
};