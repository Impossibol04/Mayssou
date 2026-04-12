const { EmbedBuilder } = require('discord.js');
const { ownerCommandDeniedLines } = require('../../utils/ownerMessages');
const { isBotOwner } = require('../../utils/commandGuards');
const { listIds, addId, removeId } = require('../../utils/guildBlacklist');

function icon(client) {
    return client.user.displayAvatarURL({ extension: 'png', size: 128 });
}

module.exports = async (client, message, args) => {
    if (!isBotOwner(message.author.id)) return message.reply(ownerCommandDeniedLines(message.author.id));

    const sub = (args[0] || '').toLowerCase();

    if (!sub || sub === 'list') {
        const ids = listIds();
        const e = new EmbedBuilder()
            .setColor(0x2c3e50)
            .setAuthor({ name: 'Blacklist serveurs', iconURL: icon(client) })
            .setTitle('📋 Liste')
            .setDescription(
                ids.length ? ids.map((id) => `\`${id}\``).join('\n').slice(0, 4000) : '*Aucun ID enregistré.*'
            )
            .setFooter({ text: `${ids.length} entrée(s)` })
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    if (sub === 'add' && args[1]) {
        addId(args[1]);
        const g = client.guilds.cache.get(args[1]);
        if (g) await g.leave().catch(() => {});
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setAuthor({ name: 'Blacklist', iconURL: icon(client) })
            .setTitle('✅ Ajouté')
            .setDescription(`Serveur \`${args[1]}\`${g ? ' — **bot quitté**.' : '.'}`)
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    if (sub === 'remove' && args[1]) {
        removeId(args[1]);
        const e = new EmbedBuilder()
            .setColor(0x57f287)
            .setAuthor({ name: 'Blacklist', iconURL: icon(client) })
            .setTitle('✅ Retiré')
            .setDescription(`\`${args[1]}\` n’est plus blacklisté.`)
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const help = new EmbedBuilder()
        .setColor(0x5865f2)
        .setAuthor({ name: 'blacklist', iconURL: icon(client) })
        .setTitle('🔐 Owner — utilisation')
        .setDescription(
            '• `blacklist` / `blacklist list` — IDs\n' +
                '• `blacklist add <id>` — ajoute + quitte le serveur\n' +
                '• `blacklist remove <id>` — retire'
        )
        .setTimestamp();
    message.reply({ embeds: [help] });
};
