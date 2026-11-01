import * as THREE from 'three';
import { INSTAGRAM_ICON_UV_RECT } from './phoneScreenSize.js';

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

// One app icon, drawn rather than loaded so the phone needs no external asset.
// The joke only works if the icon is recognisable, so this is the real mark.
export function phoneHomeTexture(highlighted = false) {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#15171a'; ctx.fillRect(0, 0, w, h);

    const r = INSTAGRAM_ICON_UV_RECT;
    const x = r.uMin * w, y = (1 - r.vMax) * h;
    const size = (r.uMax - r.uMin) * w;
    const radius = size * 0.24;

    if (highlighted) {
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.55)'; ctx.shadowBlur = 34;
    }

    // Rounded-square tile with the familiar warm corner-to-corner gradient.
    const tile = ctx.createLinearGradient(x, y + size, x + size, y);
    tile.addColorStop(0, '#FFD521');
    tile.addColorStop(0.35, '#F50000');
    tile.addColorStop(0.7, '#B900B4');
    tile.addColorStop(1, '#4C68D7');
    ctx.beginPath(); ctx.roundRect(x, y, size, size, radius);
    ctx.fillStyle = tile; ctx.fill();
    if (highlighted) ctx.restore();

    // Camera glyph: rounded outline, lens, and the small top-right dot.
    const stroke = size * 0.075;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = stroke;
    const inset = size * 0.21;
    ctx.beginPath();
    ctx.roundRect(x + inset, y + inset, size - inset * 2, size - inset * 2, size * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * 0.72, y + size * 0.28, stroke * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    ctx.textAlign = 'center'; ctx.fillStyle = '#e9e9ea';
    ctx.font = '26px -apple-system, Segoe UI, sans-serif';
    ctx.fillText('Instagram', w / 2, y + size + 44);
  }, 540, 1200);
}
