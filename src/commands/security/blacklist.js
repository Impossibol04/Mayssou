const { ownerCommandDeniedLines } = require('../../utils/ownerMessages');
const { isBotOwner } = require('../../utils/commandGuards');
const { listIds, addId, removeId } = require('../../utils/guildBlacklist');

module.exports = async (client, message, args) => {
    if (!isBotOwner(message.author.id)) return message.reply(ownerCommandDeniedLines());

    const sub = (args[0] || '').toLowerCase();
    if (!sub || sub === 'list') {
        const ids = listIds();
        return message.reply(
            ids.length ? `📋 Serveurs sur la blacklist :\n${ids.map((id) => `\`${id}\``).join('\n')}` : '📋 Liste vide.'
        );
    }

    if (sub === 'add' && args[1]) {
        addId(args[1]);
        const g = client.guilds.cache.get(args[1]);
        if (g) await g.leave().catch(() => {});
        return message.reply(`✅ Serveur \`${args[1]}\` ajouté à la blacklist${g ? ' (bot quitté).' : '.'}`);
    }

    if (sub === 'remove' && args[1]) {
        removeId(args[1]);
        return message.reply(`✅ Serveur \`${args[1]}\` retiré de la blacklist.`);
    }

    message.reply(
        '⚠️ **Utilisation**\n' +
            '• `blacklist` ou `blacklist list` — liste les IDs\n' +
            '• `blacklist add <id_serveur>` — le bot quittera ce serveur\n' +
            '• `blacklist remove <id>` — retire de la liste'
    );
};
