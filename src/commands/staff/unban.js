const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
        return message.reply("❌ Non autorisé.");

    if (!args[0]) return message.reply("⚠️ Utilisation : `+unban @user/ID`");

    const targetId = message.mentions.users.first()?.id || args[0];

    const banEntry = await message.guild.bans.fetch(targetId).catch(() => null);
    if (!banEntry) return message.reply("❌ Cet utilisateur n'est pas banni.");

    await message.guild.members.unban(targetId);

    const embed = new EmbedBuilder()
        .setTitle("✅ Membre Débanni")
        .setColor("Green")
        .addFields(
            { name: "👤 Cible", value: `${banEntry.user.username} (\`${banEntry.user.id}\`)`, inline: true },
            { name: "👮 Modérateur", value: `${message.author.username}`, inline: true }
        )
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};