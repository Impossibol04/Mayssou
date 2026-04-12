const { EmbedBuilder } = require('discord.js');
const { canViewInviteIntel } = require('../../utils/commandGuards');

function extractCode(raw) {
    if (!raw) return null;
    const s = raw.trim();
    const m = s.match(/(?:discord\.(?:gg|com\/invite)\/)([a-zA-Z0-9-]+)/i);
    if (m) return m[1];
    if (/^[a-zA-Z0-9-]+$/.test(s)) return s;
    return null;
}

module.exports = async (client, message, args) => {
    if (!canViewInviteIntel(message.member))
        return message.reply('❌ `inviteinfo` nécessite **Modérer les membres**.');

    const code = extractCode(args[0] || '');
    if (!code) return message.reply('⚠️ Utilisation : `inviteinfo <code>` ou `inviteinfo https://discord.gg/abc`');

    const inv = await client.fetchInvite(code).catch(() => null);
    if (!inv) return message.reply('❌ Invitation invalide, expirée ou inaccessible.');

    const ch = inv.channel;
    const guild = inv.guild;

    const embed = new EmbedBuilder()
        .setTitle('📨 Invitation Discord')
        .setColor(0x5865f2)
        .addFields(
            { name: 'Serveur', value: guild ? `${guild.name} (\`${guild.id}\`)` : '—', inline: false },
            { name: 'Salon', value: ch ? `${ch.name} (\`${ch.id}\`)` : '—', inline: true },
            { name: 'Créée par', value: inv.inviter ? `${inv.inviter.tag} (\`${inv.inviter.id}\`)` : '—', inline: true },
            { name: 'Utilisations', value: inv.maxUses ? `${inv.uses}/${inv.maxUses}` : `${inv.uses} / ∞`, inline: true },
            { name: 'Expire', value: inv.expiresAt ? `<t:${Math.floor(inv.expiresAt.getTime() / 1000)}:R>` : 'Jamais', inline: true },
            { name: 'Lien', value: `https://discord.gg/${inv.code}`, inline: false }
        )
        .setTimestamp();

    if (guild?.iconURL()) embed.setThumbnail(guild.iconURL({ size: 256 }));

    message.channel.send({ embeds: [embed] });
};
