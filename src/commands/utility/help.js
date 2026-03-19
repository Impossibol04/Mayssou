const { EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = async (client, message, args) => {
    const helpEmbed = new EmbedBuilder()
        .setTitle("🛠️ Manuel des Systèmes")
        .setColor("#2f3136")
        .addFields(
            { name: "🛡️ Modération", value: "`clear`, `warn`, `kick`, `ban`, `unban`, `timeout`, `lock`, `unlock`, `addrole`, `removerole`, `steal <emoji/ID>`" },
            { name: "⚙️ Configuration", value: "`setconfess #salon`" },
            { name: "🤓 Utilitaire", value: "`ping`, `uptime`, `snipe`, `calc`, `userinfo`, `serverinfo`" },
            { name: "🎵 Musique", value: "`play <titre>`, `play <titre> -k` (karaoké), `skip`, `stop`, `queue`/`q`, `loop`, `leave`" },
            { name: "🎙️ Vocal", value: "`tts <texte>`" },
            { name: "🤫 Social", value: "`confess <message>`, `poll <question>`" },
            { name: "✨ Fun", value: "`8ball`, `avatar`, `banner`, `love`, `rate`, `gay`, `67`" }
        )
        .setFooter({ text: `Prefix: ${config.prefix} • Développé par Helios_004` })
        .setTimestamp();

    message.channel.send({ embeds: [helpEmbed] });
};