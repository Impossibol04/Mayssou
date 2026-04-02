const { buildHelpPayload, resolveHelpCategory } = require('../../utils/helpPanel');

module.exports = async (client, message, args) => {
    await message.delete().catch(() => {});

    const category = resolveHelpCategory(args[0]);
    await message.channel.send(buildHelpPayload(category));
};
