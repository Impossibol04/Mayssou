const { Collection } = require('discord.js');

/**
 * Imitation minimale de message pour réutiliser les handlers prefix avec les slash commands.
 * Après `deferReply()`, le premier `reply()` ou `channel.send()` doit compléter l’interaction (sinon « réfléchit… » infini).
 */
function createSlashMessageAdapter(interaction, options = {}) {
    const {
        syntheticContent = '',
        mentionUsers = new Collection(),
        mentionMembers = new Collection(),
        mentionRoles = new Collection(),
        mentionChannels = new Collection(),
    } = options;

    let replied = false;

    const normalize = (payload) => {
        if (payload == null) return { content: '\u200b', fetchReply: true };
        if (typeof payload === 'string') return { content: payload, fetchReply: true };
        return { fetchReply: true, ...payload };
    };

    async function sendViaInteraction(payload) {
        const opts = normalize(payload);
        if (!replied) {
            replied = true;
            if (interaction.deferred) {
                await interaction.editReply(opts);
                return interaction.fetchReply();
            }
            await interaction.reply({
                ...opts,
                ephemeral: opts.ephemeral ?? false,
            });
            return interaction.fetchReply();
        }
        return interaction.followUp({
            ...opts,
            ephemeral: opts.ephemeral ?? false,
        });
    }

    const baseChannel = interaction.channel;
    const channelProxy = Object.create(baseChannel);
    channelProxy.send = (payload) => sendViaInteraction(payload);
    if (typeof baseChannel.sendTyping === 'function') {
        channelProxy.sendTyping = (opts) => baseChannel.sendTyping(opts);
    }

    return {
        author: interaction.user,
        member: interaction.member,
        channel: channelProxy,
        guild: interaction.guild,
        client: interaction.client,
        id: interaction.id,
        get content() {
            return syntheticContent;
        },
        mentions: {
            users: mentionUsers,
            roles: mentionRoles,
            members: mentionMembers,
            channels: mentionChannels,
        },
        reply: (payload) => sendViaInteraction(payload),
        async delete() {},
        async react() {},
    };
}

module.exports = { createSlashMessageAdapter };
