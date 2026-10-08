// The front door is plain HTML in index.html, painted before any JS runs. It
// offers two choices: the one-page quick view (a normal link) or the 3D room.
// It stays up until the visitor has picked the room AND the room is ready to
// show (the shaders are warm and it can fade in), then fades out. A deep link or a stored "scan" surface counts as a
// choice already made. Without the door the visitor would see a dark canvas
// while shaders compile.
import { reportProgress, subscribeProgress } from './loadProgress.js';

let best = 0;
const t0 = performance.now();
let chosen = false;
let ready = false;

// Label under the choices. Before the visitor picks the room it just says what
// is happening; after, it gives a time estimate from the pace so far.
function paint() {
  const bar = document.getElementById('front-door-bar');
  const pct = document.getElementById('front-door-pct');
  const label = document.getElementById('front-door-label');
  if (bar) bar.style.transform = `scaleX(${best})`;
  if (pct) pct.textContent = `${Math.round(best * 100)}%`;
  if (!label) return;
  if (!chosen) { label.textContent = best >= 0.99 ? 'The 3D room is ready' : 'Getting the 3D room ready'; return; }
  if (best >= 0.97) { label.textContent = 'Almost there'; return; }
  if (best < 0.08) { label.textContent = 'Loading the room'; return; }
  const left = Math.max(1, Math.round(((performance.now() - t0) * (1 - best)) / best / 1000));
  label.textContent = `Loading the room: about ${left} s left`;
}
// Registered up front so the bar cannot read 100% before the shader warm-up has even begun.
reportProgress('warm', 0, 1, 6);
subscribeProgress((s) => { best = Math.max(best, s.progress); paint(); });

export function dismissFrontDoor(instant = false) {
  const door = document.getElementById('front-door');
  if (!door || door.dataset.leaving) return;
  door.dataset.leaving = '1';
  if (instant) door.style.transition = 'none';
  door.style.opacity = '0';
  door.style.pointerEvents = 'none';
  if (instant) { door.remove(); return; }
  setTimeout(() => door.remove(), 600);
}

const readStore = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
chosen = readStore('v3:surface-override') === 'scan' || window.location.hash.replace(/^#\/?/, '') !== '';

function maybeDismiss() {
  if (chosen && ready) dismissFrontDoor();
}

function roomReadyForDoor() {
  ready = true;
  maybeDismiss();
}

const roomButton = document.getElementById('fd-room');
roomButton?.addEventListener('click', () => {
  chosen = true;
  if (!ready) {
    roomButton.setAttribute('aria-busy', 'true');
    const sub = document.getElementById('fd-room-sub');
    if (sub) sub.textContent = 'Loading the room. It opens by itself.';
  }
  paint();
  maybeDismiss();
});

window.addEventListener('workspace:revealed', roomReadyForDoor);
// The room caps its own shader wait at 20 s; never hold a visitor who chose it past that.
setTimeout(roomReadyForDoor, 30000);
