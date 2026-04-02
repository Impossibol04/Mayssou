const { Collection } = require('discord.js');

/**
 * Imitation minimale de message pour réutiliser les handlers prefix avec les slash commands.
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

    return {
        author: interaction.user,
        member: interaction.member,
        channel: interaction.channel,
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
        async reply(payload) {
            const opts = normalize(payload);
            if (!replied) {
                replied = true;
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
        },
        async delete() {},
        async react() {},
    };
}

module.exports = { createSlashMessageAdapter };
