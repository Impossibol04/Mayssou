const { EmbedBuilder } = require('discord.js');

const WMO = {
    0: 'Dégagé',
    1: 'Principalement dégagé',
    2: 'Partiellement nuageux',
    3: 'Couvert',
    45: 'Brouillard',
    48: 'Brouillard givrant',
    51: 'Bruine légère',
    61: 'Pluie légère',
    80: 'Averses',
    95: 'Orage',
};

module.exports = async (client, message, args) => {
    const q = args.join(' ').trim();
    if (!q) return message.reply('⚠️ Utilisation : `weather <ville>`');

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=fr&format=json`;
    const geoRes = await fetch(geoUrl).catch(() => null);
    if (!geoRes?.ok) return message.reply('❌ Impossible de joindre le service météo.');

    const geo = await geoRes.json();
    const hit = geo.results?.[0];
    if (!hit) return message.reply('❌ Lieu introuvable.');

    const { latitude, longitude, name, country } = hit;
    const wxUrl =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto';
    const wxRes = await fetch(wxUrl).catch(() => null);
    if (!wxRes?.ok) return message.reply('❌ Impossible de récupérer la météo.');

    const wx = await wxRes.json();
    const c = wx.current;
    const code = c.weather_code;
    const label = WMO[code] || `Code ${code}`;

    const embed = new EmbedBuilder()
        .setTitle(`🌤️ Météo — ${name}${country ? ` (${country})` : ''}`)
        .setColor(0x3498db)
        .addFields(
            { name: '🌡️ Température', value: `${c.temperature_2m} °C`, inline: true },
            { name: '💧 Humidité', value: `${c.relative_humidity_2m} %`, inline: true },
            { name: '💨 Vent', value: `${c.wind_speed_10m} km/h`, inline: true },
            { name: 'Ciel', value: label, inline: false }
        )
        .setFooter({ text: 'Open-Meteo' })
        .setTimestamp();

    message.channel.send({ embeds: [embed] });
};
