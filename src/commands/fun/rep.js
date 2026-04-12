const { EmbedBuilder } = require('discord.js');
const { getRep, addRep } = require('../../utils/repStore');

module.exports = async (client, message, args) => {
    const target = message.mentions.users.first();

    if (!target) {
        const n = getRep(message.guild.id, message.author.id);
        return message.reply(`⭐ Tu as **${n}** rep sur ce serveur. Utilise \`rep @quelqu’un\` (+1 / jour / personne).`);
    }

    if (target.bot) return message.reply('❌ Pas sur un bot.');
    if (target.id === message.author.id) return message.reply('❌ Tu ne peux pas te rep toi-même.');

    const out = addRep(message.guild.id, message.author.id, target.id);
    if (!out.ok) {
        if (out.error === 'cooldown') return message.reply('⏳ Tu as déjà donné ton rep à cette personne **aujourd’hui**.');
        return message.reply('❌ Impossible.');
    }

    const total = getRep(message.guild.id, target.id);
    message.reply(`⭐ +1 rep pour **${target.username}** ! (total **${total}**)`);
};

module.exports.cooldown = 5;
