const { EmbedBuilder } = require('discord.js');
const theme = require('../../utils/embedTheme');

module.exports = async (client, message) => {
    const url = 'https://www.reddit.com/r/memes/hot.json?limit=25';
    let data;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'MayssouBot/1.0 (Discord; by Helios)' },
        });
        if (!res.ok) throw new Error(String(res.status));
        data = await res.json();
    } catch {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Impossible de récupérer un mème pour le moment.')],
        });
    }

    const posts = (data?.data?.children || [])
        .map((c) => c?.data)
        .filter((d) => d && !d.over_18 && (d.url || d.thumbnail))
        .filter((d) => /\.(jpg|jpeg|png|gif)(\?|$)/i.test(d.url || '') || d.is_video === false);

    const pick = posts[Math.floor(Math.random() * posts.length)];
    if (!pick) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.WARN).setDescription('ℹ️ Aucun post utilisable trouvé.')],
        });
    }

    const imgUrl =
        pick.url && /\.(jpg|jpeg|png|gif)(\?|$)/i.test(pick.url)
            ? pick.url
            : pick.thumbnail && /^https?:\/\//i.test(pick.thumbnail)
              ? pick.thumbnail
              : null;

    const embed = new EmbedBuilder()
        .setTitle((pick.title || 'Mème').slice(0, 256))
        .setURL(`https://reddit.com${pick.permalink || ''}`)
        .setColor(theme.FUN)
        .setFooter({ text: `r/memes · ${pick.ups || 0}↑` });

    if (imgUrl) embed.setImage(imgUrl);
    else embed.setDescription(`[Ouvrir le post](https://reddit.com${pick.permalink || ''})`);

    return message.reply({ embeds: [embed] });
};

module.exports.expensiveCooldown = 12;
