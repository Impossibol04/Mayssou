const { createCanvas, registerFont } = require('canvas');
const path = require('path');

// On enregistre les polices avec un chemin absolu pour éviter les erreurs sur Railway
registerFont(path.join(__dirname, '../fonts/Inter_28pt-SemiBold.ttf'), { family: 'InterCustom', weight: 'bold' });
registerFont(path.join(__dirname, '../fonts/Inter_28pt-Medium.ttf'), { family: 'InterCustom', weight: 'normal' });

const W = 700;
const H = 520;

const COLORS = {
    bg:       '#0e0f13',
    card:     '#16181f',
    cardAlt:  '#1c1f29',
    border:   '#2a2d3a',
    accent:   '#5865f2',
    green:    '#3ba55d',
    gold:     '#f1c40f',
    silver:   '#95a5a6',
    bronze:   '#cd7f32',
    text:     '#ffffff',
    textMuted:'#8b8fa8',
    textDim:  '#4e5268',
    bar:      '#252836',
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

function getRankColor(i) {
    if (i === 0) return COLORS.gold;
    if (i === 1) return COLORS.silver;
    if (i === 2) return COLORS.bronze;
    return COLORS.textMuted;
}

function getRankLabel(i) {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `#${i + 1}`;
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

async function generateLeaderboardCard(data) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    const grd = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 300);
    grd.addColorStop(0, 'rgba(241,196,15,0.08)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    roundRect(ctx, 20, 20, W - 40, H - 40, 16);
    ctx.fillStyle = COLORS.card;
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Titre
    ctx.font = 'bold 22px Sans';
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'center';
    ctx.fillText(`🏆 ${data.guildName}`, W / 2, 58);
    ctx.font = '11px Sans';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText('CLASSEMENT ALL-TIME', W / 2, 76);
    ctx.textAlign = 'left';

    ctx.fillStyle = COLORS.border;
    ctx.fillRect(40, 88, W - 80, 1);
    ctx.fillRect(W / 2, 98, 1, H - 138);

    const colW = (W - 80) / 2 - 10;

    // ===========================
    // COLONNE GAUCHE — MESSAGES
    // ===========================
    const lx = 40;
    ctx.font = 'bold 12px Sans';
    ctx.fillStyle = COLORS.accent;
    ctx.fillText('💬 MESSAGES', lx, 110);

    const maxMsg = data.msgTop[0]?.count || 1;
    data.msgTop.slice(0, 8).forEach((r, i) => {
        const ty = 120 + i * 46;
        roundRect(ctx, lx, ty, colW, 36, 8);
        ctx.fillStyle = COLORS.cardAlt;
        ctx.fill();

        // Rank
        ctx.font = 'bold 13px Sans';
        ctx.fillStyle = getRankColor(i);
        ctx.fillText(getRankLabel(i), lx + 8, ty + 23);

        // Username
        ctx.font = '12px Sans';
        ctx.fillStyle = COLORS.text;
        const uname = r.username.length > 14 ? r.username.slice(0, 14) + '…' : r.username;
        ctx.fillText(uname, lx + 38, ty + 15);

        // Count
        ctx.font = 'bold 11px Sans';
        ctx.fillStyle = COLORS.accent;
        ctx.fillText(`${r.count} msgs`, lx + 38, ty + 29);

        // Barre
        drawProgressBar(ctx, lx + 130, ty + 14, colW - 138, 6, r.count / maxMsg, COLORS.accent);
    });

    // ===========================
    // COLONNE DROITE — VOCAL
    // ===========================
    const rx = W / 2 + 14;
    ctx.font = 'bold 12px Sans';
    ctx.fillStyle = COLORS.green;
    ctx.fillText('🎙️ VOCAL', rx, 110);

    const maxVoice = data.voiceTop[0]?.duration || 1;
    data.voiceTop.slice(0, 8).forEach((r, i) => {
        const ty = 120 + i * 46;
        roundRect(ctx, rx, ty, colW, 36, 8);
        ctx.fillStyle = COLORS.cardAlt;
        ctx.fill();

        ctx.font = 'bold 13px Sans';
        ctx.fillStyle = getRankColor(i);
        ctx.fillText(getRankLabel(i), rx + 8, ty + 23);

        ctx.font = '12px Sans';
        ctx.fillStyle = COLORS.text;
        const uname = r.username.length > 14 ? r.username.slice(0, 14) + '…' : r.username;
        ctx.fillText(uname, rx + 38, ty + 15);

        ctx.font = 'bold 11px Sans';
        ctx.fillStyle = COLORS.green;
        ctx.fillText(`${(r.duration / 3600).toFixed(2)}h`, rx + 38, ty + 29);

        drawProgressBar(ctx, rx + 110, ty + 14, colW - 118, 6, r.duration / maxVoice, COLORS.green);
    });

    ctx.font = '10px Sans';
    ctx.fillStyle = COLORS.textDim;
    ctx.textAlign = 'center';
    ctx.fillText(`${data.guildName} • Classement`, W / 2, H - 28);

    return canvas.toBuffer('image/png');
}

module.exports = { generateLeaderboardCard };