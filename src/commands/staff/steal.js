const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))
        return message.reply("❌ Non autorisé.");

    if (args.length === 0)
        return message.reply("⚠️ Utilisation : `+steal <emoji>` ou `+steal <ID> [nom]` ou `+steal anime <ID> [nom]`");

    const results = [];

    // Regex pour détecter un emoji custom Discord dans le message
    const emojiRegex = /<a?:(\w+):(\d+)>/g;
    const matches = [...message.content.matchAll(emojiRegex)];

    if (matches.length > 0) {
        // Mode emoji mention
        for (const match of matches) {
            const animated = match[0].startsWith('<a:');
            const originalName = match[1];
            const emojiId = match[2];
            const ext = animated ? 'gif' : 'png';
            const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;

            const customName = matches.length === 1 && args[args.length - 1] !== match[0]
                ? args[args.length - 1]
                : originalName;

            try {
                const emoji = await message.guild.emojis.create({ attachment: url, name: customName });
                results.push(`✅ ${emoji} **${emoji.name}** ajouté !`);
            } catch {
                results.push(`❌ **${originalName}** — impossible d'ajouter`);
            }
        }
    } else {
        // Mode ID direct
        const isAnimated = args[0] === 'anime';
        const emojiId = isAnimated ? args[1] : args[0];
        const name = isAnimated ? (args[2] || `emoji_${emojiId}`) : (args[1] || `emoji_${emojiId}`);
        const ext = isAnimated ? 'gif' : 'png';
        const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;

        try {
            const emoji = await message.guild.emojis.create({ attachment: url, name });
            results.push(`✅ ${emoji} **${emoji.name}** ajouté${isAnimated ? ' (animé)' : ''} !`);
        } catch {
            results.push(`❌ Impossible d'ajouter l'emoji (ID invalide ou serveur plein ?)`);
        }
    }

    message.reply(results.join('\n'));
};