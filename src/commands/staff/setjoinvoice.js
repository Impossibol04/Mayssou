const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { setGuildConfig, getGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, message, args) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
        return message.reply("❌ Tu n'as pas la permission de configurer le bot.");

    const cfg = getGuildConfig(message.guild.id);

    // Vérifie si un hub existe déjà
    if (cfg.joinVoiceChannel) {
        const existingHub = message.guild.channels.cache.get(cfg.joinVoiceChannel);
        if (existingHub) {
            return message.reply([
                `⚠️ Un salon hub existe déjà : **${existingHub.name}**`,
                `Pour en créer un nouveau, supprime d'abord l'ancien avec \`+deletejoinvoice\`.`
            ].join('\n'));
        }
    }

    let category = message.mentions.channels.first() || null;
    if (!category && args[0]) {
        category = message.guild.channels.cache.get(args[0])
            || await message.guild.channels.fetch(args[0]).catch(() => null);
    }

    try {
        const hubChannel = await message.guild.channels.create({
            name: '➕ Créer un vocal',
            type: ChannelType.GuildVoice,
            parent: category?.type === ChannelType.GuildCategory ? category : null,
        });

        setGuildConfig(message.guild.id, 'joinVoiceChannel', hubChannel.id);
        message.reply(`✅ Salon hub créé : **${hubChannel.name}**\nQuand quelqu'un le rejoindra, un vocal privé sera créé automatiquement !`);

    } catch (err) {
        console.error("Erreur création hub:", err);
        message.reply("❌ Impossible de créer le salon hub.");
    }
};