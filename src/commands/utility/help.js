const { EmbedBuilder } = require('discord.js');
//const config = require('../../../config.json');
const config = {
    token: process.env.token,
    prefix: process.env.prefix
};

module.exports = async (client, message, args) => {
    await message.delete().catch(() => {});

    const helpEmbed = new EmbedBuilder()
        .setTitle("🛠️ Manuel des Systèmes")
        .setColor("#2f3136")
        .addFields(
            { name: "🛡️ Modération", value: "`clear`, `warn`, `kick`, `ban`, `unban`, `timeout`, `lock`, `unlock`, `addrole`, `removerole`, `steal`, `vmute`, `vunmute`, `vdeafen`, `vundeafen`, `vkick`, `vmove`" },
            { name: "⚙️ Configuration", value: "`setconfess #salon`, `setwelcome join/leave #salon`, `setjoinvoice`, `deletejoinvoice`" },
            { name: "🤓 Utilitaire", value: "`ping`, `uptime`, `snipe`, `calc`, `userinfo`, `serverinfo`, `stats`, `leaderboard`/`lb`/`top`" },
            { name: "🎵 Musique", value: "`play <titre>`, `play -k <titre>` (karaoké), `skip`, `stop`, `pause`/`resume`, `queue`/`q`, `loop`, `leave`" },
            { name: "🎙️ Vocal", value: "`tts <texte>`/`say <texte>`, `voicename <nom>`, `voicelimit <nombre>`" },
            { name: "🤫 Social", value: "`confess <message>`, `poll <question>`" },
            { name: "✨ Fun", value: "`8ball`, `avatar`, `banner`, `love`, `rate`, `gay`, `67`" }
        )
        .setFooter({ text: `Prefix: ${config.prefix} • Développé par Helios_004` })
        .setTimestamp();

    message.channel.send({ embeds: [helpEmbed] });
};