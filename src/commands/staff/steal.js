const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

function icon(client) {
    return client.user.displayAvatarURL({ extension: 'png', size: 128 });
}

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Permission')
            .setDescription('Il te faut **Gérer les emojis et stickers**.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    if (args.length === 0) {
        const e = new EmbedBuilder()
            .setColor(0xf39c12)
            .setAuthor({ name: 'steal', iconURL: icon(client) })
            .setTitle('📥 Vol d’emoji')
            .setDescription(
                '• `steal <emoji>` ou plusieurs emojis dans le message\n' +
                    '• `steal <ID> [nom]` — emoji statique\n' +
                    '• `steal anime <ID> [nom]` — animé'
            )
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const results = [];
    const lines = [];

    const emojiRegex = /<a?:(\w+):(\d+)>/g;
    const matches = [...message.content.matchAll(emojiRegex)];

    if (matches.length > 0) {
        for (const match of matches) {
            const animated = match[0].startsWith('<a:');
            const originalName = match[1];
            const emojiId = match[2];
            const ext = animated ? 'gif' : 'png';
            const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;

            const customName =
                matches.length === 1 && args[args.length - 1] !== match[0] ? args[args.length - 1] : originalName;

            try {
                const emoji = await message.guild.emojis.create({ attachment: url, name: customName });
                results.push({ ok: true, text: `${emoji} **${emoji.name}**` });
            } catch {
                results.push({ ok: false, text: `**${originalName}** — échec` });
            }
        }
    } else {
        const isAnimated = args[0] === 'anime';
        const emojiId = isAnimated ? args[1] : args[0];
        const name = isAnimated ? args[2] || `emoji_${emojiId}` : args[1] || `emoji_${emojiId}`;
        const ext = isAnimated ? 'gif' : 'png';
        const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;

        try {
            const emoji = await message.guild.emojis.create({ attachment: url, name });
            results.push({
                ok: true,
                text: `${emoji} **${emoji.name}**${isAnimated ? ' *(animé)*' : ''}`,
            });
        } catch {
            results.push({ ok: false, text: 'ID invalide ou limite serveur atteinte' });
        }
    }

    for (const r of results) {
        lines.push(r.ok ? `✅ ${r.text}` : `❌ ${r.text}`);
    }

    const okCount = results.filter((r) => r.ok).length;
    const color = okCount === results.length ? 0x57f287 : okCount === 0 ? 0xe74c3c : 0xf39c12;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setAuthor({ name: 'Emojis', iconURL: icon(client) })
        .setTitle(results.length > 1 ? `Résultat (${okCount}/${results.length})` : 'Résultat')
        .setDescription(lines.join('\n').slice(0, 4096))
        .setTimestamp();

    message.reply({ embeds: [embed] });
};
