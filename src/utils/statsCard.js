const { createCanvas, loadImage } = require('canvas');
const https = require('https');

const W = 900;
const H = 420;

const COLORS = {
    bg:         '#0e0f13',
    card:       '#16181f',
    cardAlt:    '#1c1f29',
    border:     '#2a2d3a',
    accent:     '#5865f2',
    accentSoft: '#3d4499',
    green:      '#3ba55d',
    text:       '#ffffff',
    textMuted:  '#8b8fa8',
    textDim:    '#4e5268',
    bar:        '#252836',
};

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function fetchImage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function loadAvatar(url) {
    try {
        const buf = await fetchImage(url);
        return await loadImage(buf);
    } catch { return null; }
}

function drawProgressBar(ctx, x, y, w, h, percent, color) {
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = COLORS.bar;
    ctx.fill();
    const filled = Math.max(h, w * Math.min(percent, 1));
    roundRect(ctx, x, y, filled, h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawSectionTitle(ctx, title, x, y) {
    ctx.font = 'bold 11px Sans';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(title.toUpperCase(), x, y);
}

async function generateStatsCard(data) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    const grd = ctx.createRadialGradient(120, 0, 0, 120, 0, 350);
    grd.addColorStop(0, 'rgba(88,101,242,0.12)');
    grd.addColorStop(1, 'rgba(88,101,242,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    roundRect(ctx, 20, 20, W - 40, H - 40, 16);
    ctx.fillStyle = COLORS.card;
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Avatar
    const avatarSize = 80;
    const avatarX = 44;
    const avatarY = 44;

    const avatar = await loadAvatar(data.avatarUrl);
    if (avatar) {
        roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 14);
        ctx.save();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        roundRect(ctx, avatarX - 2, avatarY - 2, avatarSize + 4, avatarSize + 4, 16);
        ctx.strokeStyle = COLORS.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.font = 'bold 22px Sans';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(data.username, avatarX, avatarY + avatarSize + 24);

    ctx.font = '12px Sans';
    ctx.fillStyle = COLORS.textMuted;
    ctx.fillText(data.guildName, avatarX, avatarY + avatarSize + 42);

    ctx.fillStyle = COLORS.border;
    ctx.fillRect(220, 40, 1, H - 80);

    const dateY = avatarY + avatarSize + 70;
    drawSectionTitle(ctx, 'Compte créé', avatarX, dateY);
    ctx.font = '13px Sans';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(data.createdAt, avatarX, dateY + 16);

    drawSectionTitle(ctx, 'A rejoint le', avatarX, dateY + 42);
    ctx.font = '13px Sans';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(data.joinedAt, avatarX, dateY + 58);

    const rankY = dateY + 100;
    drawSectionTitle(ctx, 'Classement (14j)', avatarX, rankY);

    roundRect(ctx, avatarX, rankY + 8, 80, 28, 8);
    ctx.fillStyle = COLORS.accentSoft;
    ctx.fill();
    ctx.font = 'bold 13px Sans';
    ctx.fillStyle = COLORS.text;
    ctx.fillText(`💬 #${data.msgRank || 'N/A'}`, avatarX + 8, rankY + 27);

    roundRect(ctx, avatarX + 88, rankY + 8, 80, 28, 8);
    ctx.fillStyle = '#2d4a3e';
    ctx.fill();
    ctx.font = 'bold 13px Sans';
    ctx.fillStyle = COLORS.green;
    ctx.fillText(`🎙️ #${data.voiceRank || 'N/A'}`, avatarX + 96, rankY + 27);

    // Stats centre
    const cx = 244;
    const statW = (W - cx - 20 - 200) / 2 - 10;

    drawSectionTitle(ctx, '💬 Messages', cx, 56);
    [
        { label: '1 jour',   val: data.msg1d },
        { label: '7 jours',  val: data.msg7d },
        { label: '14 jours', val: data.msg14d },
        { label: 'Total',    val: data.msgTotal },
    ].forEach((s, i) => {
        const sx = cx + (i % 2) * (statW + 10);
        const sy = 68 + Math.floor(i / 2) * 56;
        roundRect(ctx, sx, sy, statW, 46, 8);
        ctx.fillStyle = COLORS.cardAlt;
        ctx.fill();
        ctx.font = '11px Sans';
        ctx.fillStyle = COLORS.textMuted;
        ctx.fillText(s.label, sx + 10, sy + 16);
        ctx.font = 'bold 16px Sans';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(s.val.toString(), sx + 10, sy + 34);
    });

    const voiceY = 196;
    drawSectionTitle(ctx, '🎙️ Temps Vocal', cx, voiceY);
    [
        { label: '1 jour',   val: `${data.voice1d}h` },
        { label: '7 jours',  val: `${data.voice7d}h` },
        { label: '14 jours', val: `${data.voice14d}h` },
        { label: 'Total',    val: `${data.voiceTotal}h` },
    ].forEach((s, i) => {
        const sx = cx + (i % 2) * (statW + 10);
        const sy = voiceY + 8 + Math.floor(i / 2) * 56;
        roundRect(ctx, sx, sy, statW, 46, 8);
        ctx.fillStyle = COLORS.cardAlt;
        ctx.fill();
        ctx.font = '11px Sans';
        ctx.fillStyle = COLORS.textMuted;
        ctx.fillText(s.label, sx + 10, sy + 16);
        ctx.font = 'bold 16px Sans';
        ctx.fillStyle = COLORS.green;
        ctx.fillText(s.val, sx + 10, sy + 34);
    });

    // Top salons droite
    const rx = W - 220;
    ctx.fillStyle = COLORS.border;
    ctx.fillRect(rx - 14, 40, 1, H - 80);

    drawSectionTitle(ctx, '📊 Top salons texte', rx, 56);
    data.topMsgChannels.forEach((c, i) => {
        const ty = 70 + i * 52;
        roundRect(ctx, rx, ty, 180, 42, 8);
        ctx.fillStyle = COLORS.cardAlt;
        ctx.fill();
        ctx.font = 'bold 12px Sans';
        ctx.fillStyle = COLORS.text;
        const name = c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name;
        ctx.fillText(`#${name}`, rx + 10, ty + 16);
        ctx.font = '11px Sans';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(`${c.count} msgs`, rx + 10, ty + 32);
        drawProgressBar(ctx, rx + 80, ty + 25, 90, 6, c.count / (data.topMsgChannels[0]?.count || 1), COLORS.accent);
    });

    drawSectionTitle(ctx, '🔊 Top salons vocaux', rx, 242);
    data.topVoiceChannels.forEach((c, i) => {
        const ty = 256 + i * 52;
        roundRect(ctx, rx, ty, 180, 42, 8);
        ctx.fillStyle = COLORS.cardAlt;
        ctx.fill();
        ctx.font = 'bold 12px Sans';
        ctx.fillStyle = COLORS.text;
        const name = c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name;
        ctx.fillText(`🔊 ${name}`, rx + 10, ty + 16);
        ctx.font = '11px Sans';
        ctx.fillStyle = COLORS.green;
        ctx.fillText(`${(c.total / 3600).toFixed(2)}h`, rx + 10, ty + 32);
        drawProgressBar(ctx, rx + 80, ty + 25, 90, 6, c.total / (data.topVoiceChannels[0]?.total || 1), COLORS.green);
    });

    ctx.font = '10px Sans';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(`${data.guildName} • Stats`, cx, H - 30);

    return canvas.toBuffer('image/png');
}

module.exports = { generateStatsCard };