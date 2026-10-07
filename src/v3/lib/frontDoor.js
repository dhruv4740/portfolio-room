// The front door is plain HTML in index.html, painted before any JS runs. It
// stays up until the room has compiled its shaders and fades in
// (`workspace:revealed`), or the deck mounts, then fades out. Without it the
// visitor sees a dark canvas while shaders compile.
import { subscribeProgress } from './loadProgress.js';

let best = 0;
subscribeProgress((s) => {
  best = Math.max(best, s.progress);
  const bar = document.getElementById('front-door-bar');
  const pct = document.getElementById('front-door-pct');
  const label = document.getElementById('front-door-label');
  if (bar) bar.style.transform = `scaleX(${best})`;
  if (pct) pct.textContent = `${Math.round(best * 100)}%`;
  if (label && best >= 0.99) label.textContent = 'Building the room';
});

export function dismissFrontDoor() {
  const door = document.getElementById('front-door');
  if (!door || door.dataset.leaving) return;
  door.dataset.leaving = '1';
  door.style.opacity = '0';
  door.style.pointerEvents = 'none';
  setTimeout(() => door.remove(), 600);
}

window.addEventListener('workspace:revealed', dismissFrontDoor);
// The room caps its own shader wait at 20 s; never leave the door up past that.
setTimeout(dismissFrontDoor, 25000);
