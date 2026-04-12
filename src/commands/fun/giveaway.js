const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { saveGiveaway } = require('../../utils/giveawayStore');
const { finalizeGiveaway } = require('../../utils/giveawayRunner');
const theme = require('../../utils/embedTheme');

module.exports = async (client, message, args) => {
    const sub = (args[0] || '').toLowerCase();
    const p = (process.env.prefix || '+').trim() || '+';

    if (sub !== 'start') {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.WARN)
                    .setDescription(
                        `⚠️ \`${p}giveaway start <minutes> <gagnants> <lot>\`\nRéagis avec 🎉 sur le message du bot pour participer.`
                    ),
            ],
        });
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ **Gérer le serveur** requis.')],
        });
    }

    const minutes = parseInt(args[1], 10);
    const winners = parseInt(args[2], 10);
    const prize = args.slice(3).join(' ').trim();
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 10080 || !Number.isFinite(winners) || winners < 1 || winners > 15 || !prize) {
        return message.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(theme.WARN)
                    .setDescription(`⚠️ \`${p}giveaway start <1-10080 min> <1-15 gagnants> <description du lot>\``),
            ],
        });
    }
    if (prize.length > 200) {
        return message.reply({
            embeds: [new EmbedBuilder().setColor(theme.ERROR).setDescription('❌ Description du lot trop longue (max 200).')],
        });
    }

    const endAt = Date.now() + minutes * 60 * 1000;
    const embed = new EmbedBuilder()
        .setTitle('🎉 Concours')
        .setColor(theme.FUN)
        .setDescription(
            `**Lot :** ${prize}\n\n**Gagnants :** ${winners}\n**Fin :** <t:${Math.floor(endAt / 1000)}:R>\n\nRéagis avec **🎉** pour participer !`
        )
        .setFooter({ text: `Lancé par ${message.author.tag}` })
        .setTimestamp();

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react('🎉').catch(() => {});

    saveGiveaway(message.guild.id, msg.id, {
        ended: false,
        endAt,
        prize,
        winnersCount: winners,
        channelId: message.channel.id,
        hostId: message.author.id,
    });

    setTimeout(() => {
        finalizeGiveaway(client, {
            guildId: message.guild.id,
            messageId: msg.id,
            channelId: message.channel.id,
            prize,
            winnersCount: winners,
        }).catch(() => {});
    }, endAt - Date.now());
};

module.exports.aliases = ['concours'];
module.exports.expensiveCooldown = 20;
