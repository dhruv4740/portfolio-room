// The front door is plain HTML in index.html, painted before any JS runs. It
// offers two choices: the one-page quick view (a normal link) or the 3D room.
// It stays up until the visitor has picked the room AND the room is ready to
// show (the shaders are warm and it can fade in), then fades out. A deep link or a stored "scan" surface counts as a
// choice already made. Without the door the visitor would see a dark canvas
// while shaders compile.
import { reportProgress, subscribeProgress } from './loadProgress.js';

let best = 0;
let chosen = false;
let ready = false;

// The shown value eases toward the real progress and stays below 100% until the
// room is ready, so 100% means it can open. `best` only rises, so the eased value
// and the stage label (derived from `best`) never go backwards.
let shown = 0;
let frame = 0;
const goal = () => (ready ? 1 : Math.min(best, 0.99));

function paint() {
  const bar = document.getElementById('front-door-bar');
  const pct = document.getElementById('front-door-pct');
  const label = document.getElementById('front-door-label');
  if (bar) bar.style.transform = `scaleX(${shown})`;
  if (pct) pct.textContent = `${Math.floor(shown * 100)}%`;
  if (!label) return;
  if (!chosen) { label.textContent = ready ? 'The 3D room is ready' : 'Getting the 3D room ready'; return; }
  if (ready) label.textContent = 'Opening the room';
  else if (shown >= 0.9) label.textContent = 'Almost there';
  else if (shown >= 0.5) label.textContent = 'Preparing the room';
  else label.textContent = 'Loading the room';
}

function tick() {
  frame = 0;
  const target = goal();
  shown += (target - shown) * 0.15;
  if (target - shown < 0.002) shown = target;
  paint();
  if (shown !== target) frame = requestAnimationFrame(tick);
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(tick);
}

// Registered up front so the bar cannot read 100% before the shader warm-up has even begun.
reportProgress('warm', 0, 1, 6);
subscribeProgress((s) => { best = Math.max(best, s.progress); schedule(); });

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
chosen = readStore('v3:surface-override') === 'scan' || window.location.hash.replace(/^#\/?/, '') !== '' || /[?&](room|tour)(=|&|$)/.test(window.location.search);

function maybeDismiss() {
  if (chosen && ready) dismissFrontDoor();
}

function roomReadyForDoor() {
  ready = true;
  schedule();
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
  schedule();
  maybeDismiss();
});

window.addEventListener('workspace:revealed', roomReadyForDoor);
// The room caps its own shader wait at 20 s; never hold a visitor who chose it past that.
setTimeout(roomReadyForDoor, 30000);
