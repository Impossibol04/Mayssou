module.exports = async (client, message, args) => {
    const res = ["Oui", "Non", "Probablement", "Peu probable", "Demande à ton chat", "Le code dit OUI"];
    message.reply(`🎱 | ${res[Math.floor(Math.random() * res.length)]}`);
};