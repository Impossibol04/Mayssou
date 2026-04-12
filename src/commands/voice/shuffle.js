const { musicData } = require('../../utils/musicManager');

function sameVoice(message) {
    const vc = message.member.voice.channel;
    const botVc = message.guild.members.me?.voice?.channel;
    return vc && botVc && vc.id === botVc.id;
}

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

module.exports = async (client, message, args) => {
    if (!sameVoice(message)) return message.reply('❌ Rejoins le **même salon vocal** que le bot.');

    const data = musicData.get(message.guild.id);
    if (!data?.queue?.length) return message.reply('⚠️ La file est vide (rien à mélanger).');

    shuffleInPlace(data.queue);
    message.reply(`🔀 **${data.queue.length}** morceau(x) mélangé(s) dans la file.`);
};
