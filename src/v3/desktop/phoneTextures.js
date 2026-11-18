import * as THREE from 'three';
import { PHONE_HOME_APPS } from './phoneScreenSize.js';

export function canvasTexture(draw, width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Only seen from the seat once you pull back out of the zoomed phone: a small
// stand-in for PhoneScreen's lock screen (FocusLock's overlay_lock.xml), so the
// handoff does not pop to a different screen. 540 x 1200, same as PhoneScreen.
export function phoneFocusLockTexture() {
  return canvasTexture((ctx, w) => {
    const card = (y, height, fill = '#1E293B', radius = 24, stroke = true) => {
      ctx.beginPath(); ctx.roundRect(36, y, w - 72, height, radius); ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.5; ctx.stroke(); }
    };
    ctx.fillStyle = '#121820'; ctx.fillRect(0, 0, w, 1200);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.beginPath(); ctx.roundRect(w / 2 - 66, 300, 132, 34, 17); ctx.fillStyle = '#1E293B'; ctx.fill();
    ctx.fillStyle = '#EF4444'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('LOCKED', w / 2, 318);
    ctx.fillStyle = '#F8FAFC'; ctx.font = 'bold 36px sans-serif';
    ctx.fillText('FocusLock paused', w / 2, 384); ctx.fillText('com.instagram.android', w / 2, 428);
    card(470, 96);
    ctx.fillStyle = '#94A3B8'; ctx.font = 'bold 17px sans-serif'; ctx.fillText("TODAY'S USAGE", w / 2, 518);
    card(596, 100);
    card(732, 72, '#111827', 18);
    ctx.fillStyle = '#F8FAFC'; ctx.font = '21px sans-serif'; ctx.fillText('Request 5 Minute Extension', w / 2, 768);
    card(819, 72, '#6366F1', 18, false);
    ctx.fillStyle = '#0A0E17'; ctx.font = 'bold 21px sans-serif'; ctx.fillText('I will take a break now', w / 2, 855);
  }, 540, 1200);
}

// Glyphs in PhoneScreen's 100 x 100 icon space, drawn as Path2D so they match
// the DOM icons. Instagram is the real mark (the joke needs it recognisable).
const GLYPHS = {
  focuslock: ['M50 20 L77 30 V50 C77 66 63 77 50 82 C37 77 23 66 23 50 V30 Z', 'M56 46 A6 6 0 1 1 44 46 A6 6 0 1 1 56 46 Z', 'M50 52 V60'],
  expense: ['M22 78 H78', 'M26 64 L42 46 L56 56 L76 30', 'M64 30 H76 V42'],
  basketproof: ['M22 44 H78 L70 78 H30 Z', 'M36 44 C36 28 64 28 64 44'],
  contact: ['M24 28 H76 V62 H46 L32 74 V62 H24 Z'],
  blackout: ['M80 50 A30 30 0 1 1 20 50 A30 30 0 1 1 80 50 Z'],
};

// The home screen the phone shows on the desk: wallpaper, clock and one icon
// per app PhoneScreen opens (PHONE_HOME_APPS). 540 x 1200, same as PhoneScreen.
export function phoneHomeTexture(highlighted = false) {
  return canvasTexture((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w * 0.4, h);
    bg.addColorStop(0, '#111a2c'); bg.addColorStop(0.55, '#0A0E17'); bg.addColorStop(1, '#14172a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * 0.75, h * 0.12, 10, w * 0.75, h * 0.12, 420);
    glow.addColorStop(0, 'rgba(99,102,241,0.22)'); glow.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left'; ctx.fillStyle = '#F8FAFC'; ctx.font = '600 24px -apple-system, Segoe UI, sans-serif';
    ctx.fillText(time, 36, 50);
    ctx.textAlign = 'right'; ctx.fillStyle = '#94A3B8'; ctx.font = '500 16px -apple-system, Segoe UI, sans-serif';
    ctx.fillText('5G   100%', w - 36, 48);
    ctx.textAlign = 'center'; ctx.fillStyle = '#F8FAFC'; ctx.font = '200 150px -apple-system, Segoe UI, sans-serif';
    ctx.fillText(time, w / 2, 250);
    ctx.fillStyle = '#94A3B8'; ctx.font = '400 28px -apple-system, Segoe UI, sans-serif';
    ctx.fillText(now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }), w / 2, 305);

    for (const app of PHONE_HOME_APPS) {
      const { left: x, top: y, size, label } = app;
      const radius = size * 0.24;
      if (app.id === 'instagram') {
        if (highlighted) { ctx.save(); ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 34; }
        const tile = ctx.createLinearGradient(x, y + size, x + size, y);
        tile.addColorStop(0, '#FFD521'); tile.addColorStop(0.35, '#F50000'); tile.addColorStop(0.7, '#B900B4'); tile.addColorStop(1, '#4C68D7');
        ctx.beginPath(); ctx.roundRect(x, y, size, size, radius); ctx.fillStyle = tile; ctx.fill();
        if (highlighted) ctx.restore();
        const stroke = size * 0.075; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = stroke;
        const inset = size * 0.21;
        ctx.beginPath(); ctx.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, size * 0.2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size * 0.17, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + size * 0.72, y + size * 0.28, stroke * 0.62, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
      } else {
        const black = app.id === 'blackout';
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
        ctx.beginPath(); ctx.roundRect(x, y, size, size, radius);
        if (black) ctx.fillStyle = '#000';
        else { const g = ctx.createLinearGradient(x, y, x + size * 0.4, y + size); g.addColorStop(0, '#2c2b28'); g.addColorStop(1, '#1b1a18'); ctx.fillStyle = g; }
        ctx.fill(); ctx.restore();
        if (!black) { ctx.beginPath(); ctx.roundRect(x, y, size, size, radius); ctx.strokeStyle = '#4a4842'; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.save(); ctx.translate(x + size * 0.19, y + size * 0.19); ctx.scale(size * 0.62 / 100, size * 0.62 / 100);
        ctx.strokeStyle = black ? '#ffffff' : '#e8e4d8'; ctx.lineWidth = black ? 3 : 5.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const d of GLYPHS[app.id]) ctx.stroke(new Path2D(d));
        ctx.restore();
      }
      ctx.textAlign = 'center'; ctx.fillStyle = '#e9e9ea';
      ctx.font = '500 24px -apple-system, Segoe UI, sans-serif';
      ctx.fillText(label, x + size / 2, y + size + 40);
    }
  }, 540, 1200);
}
