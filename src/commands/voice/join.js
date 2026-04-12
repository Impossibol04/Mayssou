const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel } = require('@discordjs/voice');
const { createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const { musicData, voiceTimeouts, playNext } = require('../../utils/musicManager');

function botIcon(client) {
    return client.user.displayAvatarURL({ extension: 'png', size: 128 });
}

module.exports = async (client, message) => {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Salon vocal requis')
            .setDescription('Rejoins un **salon vocal**, puis relance la commande.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const perms = voiceChannel.permissionsFor(client.user);
    if (!perms?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
        const e = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle('❌ Permissions')
            .setDescription('Il me faut **Connexion** et **Parler** dans ce salon.')
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const guild = message.guild;
    const existingConn = getVoiceConnection(guild.id);
    const alreadyHere = existingConn && existingConn.joinConfig.channelId === voiceChannel.id;

    if (alreadyHere) {
        const e = new EmbedBuilder()
            .setColor(0x5865f2)
            .setAuthor({ name: 'Musique', iconURL: botIcon(client) })
            .setTitle('🔊 Déjà connecté')
            .setDescription(`Je suis déjà dans **${voiceChannel.name}**.`)
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    const data = musicData.get(guild.id);
    const busy =
        data?.player &&
        (data.player.state.status === AudioPlayerStatus.Playing ||
            data.player.state.status === AudioPlayerStatus.Buffering);

    if (busy && existingConn && existingConn.joinConfig.channelId !== voiceChannel.id) {
        const e = new EmbedBuilder()
            .setColor(0xf39c12)
            .setTitle('⚠️ Lecture en cours')
            .setDescription(
                'Je joue de la musique dans **un autre salon**. Rejoins ce salon ou utilise `stop` / `leave` avant de me déplacer.'
            )
            .setTimestamp();
        return message.reply({ embeds: [e] });
    }

    if (voiceTimeouts.has(guild.id)) {
        clearTimeout(voiceTimeouts.get(guild.id));
        voiceTimeouts.delete(guild.id);
    }

    if (data) data.suppressIdleAdvance = true;
    try {
        if (existingConn) existingConn.destroy();
    } catch (_) {}

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    if (data) {
        data.connection = connection;
        connection.subscribe(data.player);
        data.suppressIdleAdvance = false;
    } else {
        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
        connection.subscribe(player);
        musicData.set(guild.id, {
            player,
            connection,
            queue: [],
            currentTrack: null,
            loop: false,
            stopped: false,
            volume: 100,
            suppressIdleAdvance: false,
            autoplay: false,
        });

        player.on('error', (err) => console.error('[join/player]', err.message));
        player.on(AudioPlayerStatus.Idle, () => {
            const currentData = musicData.get(guild.id);
            if (currentData?.suppressIdleAdvance) return;
            if (currentData?.stopped) {
                currentData.stopped = false;
                return;
            }
            playNext(guild.id, message.channel);
        });
    }

    const ok = new EmbedBuilder()
        .setColor(0x57f287)
        .setAuthor({ name: 'Salon vocal', iconURL: botIcon(client) })
        .setTitle('✅ Connecté')
        .setDescription(
            `J’ai rejoint **${voiceChannel.name}**.\n` +
                'Tu peux lancer une piste avec `play` / `/play`.'
        )
        .setFooter({ text: 'Sans musique, je quitte après 5 min d’inactivité' })
        .setTimestamp();

    message.reply({ embeds: [ok] });
};
