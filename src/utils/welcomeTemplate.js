/**
 * Remplace {mention} {user} {tag} {server} {count} dans un modèle texte.
 * @param {string} template
 * @param {{ member?: import('discord.js').GuildMember, guild: import('discord.js').Guild }} ctx
 */
function renderWelcomeTemplate(template, ctx) {
    const m = ctx.member;
    const g = ctx.guild;
    const user = m?.user;
    return template
        .replaceAll('{mention}', m ? `<@${m.id}>` : '')
        .replaceAll('{user}', user?.username ?? 'Utilisateur')
        .replaceAll('{tag}', user?.tag ?? '')
        .replaceAll('{server}', g.name ?? '')
        .replaceAll('{count}', String(g.memberCount ?? '?'));
}

module.exports = { renderWelcomeTemplate };
