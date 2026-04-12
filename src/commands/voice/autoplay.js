const { musicData } = require('../../utils/musicManager');

function sameVoice(message) {
    const vc = message.member.voice.channel;
    const botVc = message.guild.members.me?.voice?.channel;
    return vc && botVc && vc.id === botVc.id;
}

module.exports = async (client, message, args) => {
    if (!sameVoice(message)) return message.reply('❌ Rejoins le **même salon vocal** que le bot.');

    const data = musicData.get(message.guild.id);
    if (!data) return message.reply('⚠️ Aucune session musique active.');

    const v = (args[0] || '').toLowerCase();
    if (v === 'on' || v === '1' || v === 'oui') data.autoplay = true;
    else if (v === 'off' || v === '0' || v === 'non') data.autoplay = false;
    else data.autoplay = !data.autoplay;

    message.reply(`🎲 Autoplay : **${data.autoplay ? 'activé' : 'désactivé'}** (SoundCloud, d’après l’artiste en cours).`);
};
