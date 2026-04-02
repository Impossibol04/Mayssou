const { REST, Routes } = require('discord.js');
const { createSlashMessageAdapter } = require('../utils/slashAdapter');
const slashRegistry = require('../slash/registry');
const { applyVoiceUserLimit, buildVoicelimitButtonRow } = require('../utils/voiceLimitShared');
const { HELP_SELECT_ID, buildHelpPayload } = require('../utils/helpPanel');
const { handleVoiceOwnerPanelInteraction } = require('../utils/voiceOwnerPanel');

async function registerSlashCommands(client) {
    const token = process.env.token;
    if (!token) return;

    const body = slashRegistry.map((e) => e.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(token);
    const guildId = process.env.DISCORD_GUILD_ID;

    try {
        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body });
            console.log(`✅ ${body.length} commandes slash enregistrées (serveur ${guildId}).`);
        } else {
            await rest.put(Routes.applicationCommands(client.user.id), { body });
            console.log(`✅ ${body.length} commandes slash enregistrées (global — propagation jusqu’à ~1 h).`);
        }
    } catch (err) {
        console.error('❌ Échec enregistrement slash:', err);
    }
}

async function runSlashEntry(bot, interaction, entry) {
    if (entry.customExecute) {
        await entry.customExecute(bot, interaction);
        return;
    }
    const cmd = bot.commands.get(entry.commandName);
    if (!cmd) return;
    const enrich = entry.enrichMentions ? await entry.enrichMentions(interaction) : {};
    const syntheticContent = entry.syntheticContent ? entry.syntheticContent(interaction) : '';
    const adapter = createSlashMessageAdapter(interaction, {
        syntheticContent,
        ...enrich,
    });
    const args = entry.toArgs(interaction);
    await cmd(bot, adapter, args);
}

module.exports = (bot) => {
    bot.once('ready', () => registerSlashCommands(bot));

    bot.on('interactionCreate', async (interaction) => {
        if (interaction.isButton() && interaction.customId.startsWith('vl:')) {
            const parts = interaction.customId.split(':');
            if (parts.length !== 3) return;
            const channelId = parts[1];
            const limit = parseInt(parts[2], 10);

            const voiceChannel = interaction.member?.voice?.channel;
            if (!voiceChannel) {
                return interaction.reply({ ephemeral: true, content: "❌ Tu dois être dans un salon vocal !" });
            }
            if (voiceChannel.id !== channelId) {
                return interaction.reply({ ephemeral: true, content: "❌ Utilise les boutons sur ton salon actuel." });
            }

            const result = await applyVoiceUserLimit(bot, interaction.user.id, voiceChannel, limit);
            if (!result.ok) {
                return interaction.reply({ ephemeral: true, content: result.error });
            }

            try {
                await interaction.deferUpdate();
                const text = result.limit === 0
                    ? "🔓 Salon illimité !"
                    : `👥 Limite fixée à **${result.limit} personne(s)** !`;
                await interaction.message.edit({
                    content: text,
                    components: [buildVoicelimitButtonRow(voiceChannel.id)],
                });
            } catch (err) {
                console.error(err);
                try {
                    await interaction.followUp({ ephemeral: true, content: "❌ Impossible de mettre à jour le message." });
                } catch (_) {}
            }
            return;
        }

        if (
            (interaction.isButton() && interaction.customId.startsWith('vcp:')) ||
            (interaction.isModalSubmit() && interaction.customId.startsWith('vcp:m:'))
        ) {
            const handled = await handleVoiceOwnerPanelInteraction(bot, interaction);
            if (handled) return;
        }

        if (interaction.isStringSelectMenu() && interaction.customId === HELP_SELECT_ID) {
            const cat = interaction.values[0];
            try {
                await interaction.update(buildHelpPayload(cat));
            } catch (err) {
                console.error('help select:', err);
                await interaction.reply({ ephemeral: true, content: '❌ Impossible de mettre à jour l’aide.' }).catch(() => {});
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const entry = slashRegistry.find((e) => e.data.name === interaction.commandName);
        if (!entry) return;

        try {
            await runSlashEntry(bot, interaction, entry);
        } catch (err) {
            console.error('Erreur slash:', err);
            const payload = { content: "❌ Une erreur est survenue dans cette commande.", ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(payload).catch(() => {});
            } else {
                await interaction.reply(payload).catch(() => {});
            }
        }
    });
};
