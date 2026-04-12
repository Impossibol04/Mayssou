const { getGuildConfig } = require('./guildConfig');

function defaultPrefix() {
    return (process.env.prefix || '+').trim() || '+';
}

function resolvePrefix(guild) {
    const def = defaultPrefix();
    if (!guild) return def;
    const p = getGuildConfig(guild.id).prefix;
    if (typeof p === 'string' && p.length >= 1 && p.length <= 8 && !/\s/.test(p)) return p;
    return def;
}

module.exports = { defaultPrefix, resolvePrefix };
