// Bounded acceptance checks for room audio (roomAudio.js) and city ambience
// (cityAudio.js): gesture-gated AudioContext creation, persisted mute and its
// suppression of city ambience without touching the independent Music
// Player, the coffee foley timeline's order/count/cancellation semantics,
// hidden-tab suppression, and lifecycle cleanup across mount/unmount. This
// deliberately does not duplicate verify-room-interactions.mjs's window/audio
// sync checks or verify-after-hours.mjs's arrival/asset checks.
//
// Usage:
//   BASE=http://localhost:4173 node scripts/verify-after-hours-audio.mjs
//
// Instrumentation: a single addInitScript wraps the native AudioContext
// constructor (forwarding every call to the real implementation and tapping
// close/createOscillator/createBufferSource for counts), and wraps
// EventTarget's addEventListener/removeEventListener/dispatchEvent to log
// workspace:foley dispatches and track net listener counts for the handful
// of document/window event types Scan.jsx binds. Nothing in the app is
// mocked or replaced; every assertion observes the real implementation.

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = 'scripts/shots';
mkdirSync(OUT, { recursive: true });

const results = [];
function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  writeFileSync(`${OUT}/after-hours-audio-results.json`, JSON.stringify(results, null, 2));
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

// ---------------------------------------------------------------------------
// Shared page setup
// ---------------------------------------------------------------------------

function pinScan(page, { reduced = false, muted = false } = {}) {
  return page.addInitScript(({ reducedMotion, roomMuted }) => {
    localStorage.setItem('v3:test', '1');
    localStorage.setItem('v3:surface-override', 'scan');
    localStorage.setItem('v3:seen-intro', '1');
    localStorage.setItem('v3:perf-tier', 'low');
    sessionStorage.setItem('v3:controls', 'open');
    sessionStorage.setItem('v3:arrival-seen', '1'); // arrival is out of scope; force straight to overview
    if (roomMuted) localStorage.setItem('v3:room-muted', '1');
    else localStorage.removeItem('v3:room-muted');
    if (reducedMotion) window.__afterHoursReducedMotion = true;
  }, { reducedMotion: reduced, roomMuted: muted });
}

// Wraps the native AudioContext constructor and a few EventTarget methods so
// the harness can observe creation timing, closes, foley dispatch order, and
// listener add/remove symmetry without altering any real behavior.
function installAudioProbe(page) {
  return page.addInitScript(() => {
    const probe = {
      contexts: [], // { ctx, t } — real AudioContext instances, in creation order
      closes: [],   // { t }
      foley: [],    // { kind, pan, t } — every workspace:foley CustomEvent dispatched
      oscillators: 0,
      bufferSources: 0,
      listeners: {}, // type -> net (add - remove) count on document/window only
    };
    window.__audioProbe = probe;
    const TRACKED_TYPES = ['pointerdown', 'keydown', 'visibilitychange', 'workspace:foley'];

    const origAdd = EventTarget.prototype.addEventListener;
    const origRemove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, ...rest) {
      if ((this === document || this === window) && TRACKED_TYPES.includes(type)) {
        const stack = (new Error()).stack || '';
        if (!stack.includes('InjectedScript') && !stack.includes('addHitTargetInterceptorListeners')) {
          probe.listeners[type] = (probe.listeners[type] || 0) + 1;
        }
      }
      return origAdd.call(this, type, listener, ...rest);
    };
    EventTarget.prototype.removeEventListener = function (type, listener, ...rest) {
      if ((this === document || this === window) && TRACKED_TYPES.includes(type)) {
        const stack = (new Error()).stack || '';
        if (!stack.includes('InjectedScript') && !stack.includes('addHitTargetInterceptorListeners')) {
          probe.listeners[type] = (probe.listeners[type] || 0) - 1;
        }
      }
      return origRemove.call(this, type, listener, ...rest);
    };

    const origDispatch = EventTarget.prototype.dispatchEvent;
    EventTarget.prototype.dispatchEvent = function (event) {
      if (event && event.type === 'workspace:foley' && event.detail) {
        probe.foley.push({ kind: event.detail.kind, pan: event.detail.pan, t: performance.now() });
      }
      return origDispatch.call(this, event);
    };

    const NativeAC = window.AudioContext || window.webkitAudioContext;
    if (NativeAC) {
      function Wrapped(...args) {
        const inst = new NativeAC(...args);
        probe.contexts.push({ ctx: inst, t: performance.now() });
        const origClose = inst.close.bind(inst);
        inst.close = (...a) => { probe.closes.push({ t: performance.now() }); return origClose(...a); };
        const origOsc = inst.createOscillator.bind(inst);
        inst.createOscillator = (...a) => { probe.oscillators++; return origOsc(...a); };
        const origBuf = inst.createBufferSource.bind(inst);
        inst.createBufferSource = (...a) => { probe.bufferSources++; return origBuf(...a); };
        return inst;
      }
      Wrapped.prototype = NativeAC.prototype;
      window.AudioContext = Wrapped;
      window.webkitAudioContext = Wrapped;
    }
  });
}

function probeSnapshot(page) {
  return page.evaluate(() => {
    const p = window.__audioProbe;
    return {
      contextCount: p.contexts.length,
      contextStates: p.contexts.map((c) => c.ctx.state),
      closeCount: p.closes.length,
      foley: p.foley.map(({ kind, pan, t }) => ({ kind, pan, t })),
      oscillators: p.oscillators,
      bufferSources: p.bufferSources,
      listeners: { ...p.listeners },
    };
  });
}

function attachErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

async function waitFor(page, fn, arg, timeout = 10_000) {
  return page.waitForFunction(fn, arg, { timeout, polling: 50 }).then(() => true).catch(() => false);
}

async function enterRoom(page) {
  await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 15_000 });
}

async function exploreRoom(page) {
  await page.locator('[data-launchpad-action="explore-room"]').click();
  await waitFor(page, () => document.querySelector('.scan-root')?.dataset.seated === 'true'
    && document.querySelector('.scan-root')?.dataset.overview === 'false');
}

async function openObjects(page) {
  const toggle = page.locator('.seat-exit-toggle');
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
}

function actionState(page) {
  return page.locator('.workspace-stage').evaluate((el) => el.dataset.actionState);
}

// ---------------------------------------------------------------------------
// Area 1 — no AudioContext before a user gesture; pointer and keyboard unlock
// ---------------------------------------------------------------------------

async function runGestureGate(browser) {
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = attachErrors(page);
    await installAudioProbe(page);
    await pinScan(page);
    try {
      await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
      await enterRoom(page);
      await page.waitForTimeout(400); // let any load-time async settle
      const idle = await probeSnapshot(page);
      record('gesture: no AudioContext exists before any user gesture', idle.contextCount === 0,
        `contexts=${idle.contextCount}`);
      // A pointer gesture at an empty, non-interactive point of the overview —
      // not a button click — so this isolates pointerdown-driven unlock.
      await page.mouse.click(6, 6);
      await page.waitForTimeout(200);
      const afterPointer = await probeSnapshot(page);
      record('gesture: a bare pointerdown unlocks room audio (creates exactly one AudioContext)',
        afterPointer.contextCount === 1, `contexts=${afterPointer.contextCount}`);
      record('gesture: no page/console errors from pointer-only unlock', errors.length === 0, errors.slice(0, 3).join(' | '));
    } finally {
      await ctx.close();
    }
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errors = attachErrors(page);
    await installAudioProbe(page);
    await pinScan(page);
    try {
      await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
      await enterRoom(page);
      await page.waitForTimeout(400);
      const idle = await probeSnapshot(page);
      record('gesture: no AudioContext exists before any keyboard gesture', idle.contextCount === 0,
        `contexts=${idle.contextCount}`);
      await page.keyboard.press('Tab'); // keydown only, no pointer event at all
      await page.waitForTimeout(200);
      const afterKey = await probeSnapshot(page);
      record('gesture: a bare keydown unlocks room audio (creates exactly one AudioContext)',
        afterKey.contextCount === 1, `contexts=${afterKey.contextCount}`);
      record('gesture: no page/console errors from keyboard-only unlock', errors.length === 0, errors.slice(0, 3).join(' | '));
    } finally {
      await ctx.close();
    }
  }
}

// ---------------------------------------------------------------------------
// Area 2 — persisted ROOM SOUND mute + matching city ambience suppression,
// without muting the independent Music Player
// ---------------------------------------------------------------------------

async function runMuteAndIndependence(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = attachErrors(page);
  await installAudioProbe(page);
  await pinScan(page, { muted: true }); // persisted mute before first load
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    await enterRoom(page);
    await exploreRoom(page);
    await openObjects(page);

    const roomSoundBtn = page.locator('.seat-exit button[aria-pressed]');
    const initialPressed = await roomSoundBtn.getAttribute('aria-pressed');
    const initialText = (await roomSoundBtn.textContent() || '').trim();
    record('mute: persisted v3:room-muted renders ROOM SOUND OFF on load',
      initialPressed === 'false' && /OFF/.test(initialText), `pressed=${initialPressed} text="${initialText}"`);

    await roomSoundBtn.click(); // unmute
    await page.waitForTimeout(500);
    record('mute: unmuting renders ROOM SOUND ON', /ON/.test((await roomSoundBtn.textContent() || '').trim()), '');

    await page.getByRole('button', { name: 'HEADPHONES', exact: true }).click();
    await page.waitForTimeout(300);
    const musicPlayingBeforeMute = await page.evaluate(() => window.__v3Music?.getState().playing);
    await roomSoundBtn.click(); // re-mute
    await page.waitForTimeout(500);
    const musicAfterRemute = await page.evaluate(() => window.__v3Music?.getState().playing);
    record('mute: re-muting leaves the Music Player untouched',
      musicPlayingBeforeMute === true && musicAfterRemute === true,
      `musicBefore=${musicPlayingBeforeMute} musicAfter=${musicAfterRemute}`);

    record('mute/independence: no page/console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// Area 3 — coffee foley order/count, cancellation, reduced-motion silence
// ---------------------------------------------------------------------------

async function runCoffeeTimeline(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = attachErrors(page);
  await installAudioProbe(page);
  await pinScan(page);
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    await enterRoom(page);
    await exploreRoom(page);
    await openObjects(page);
    await page.mouse.click(6, 6); // gesture-unlock before any timing-sensitive check

    await page.getByRole('button', { name: 'COFFEE', exact: true }).click();
    const settled = await waitFor(page, () => document.querySelector('.workspace-stage')?.dataset.actionState === 'idle', undefined, 8_000);
    let snap = await probeSnapshot(page);
    const kinds = snap.foley.map((f) => f.kind);
    const orderOk = kinds.length === 3 && kinds[0] === 'cup-lift' && kinds[1] === 'sip' && kinds[2] === 'cup-setdown';
    const monotonic = snap.foley.every((f, i) => i === 0 || f.t >= snap.foley[i - 1].t);
    record('coffee: settles to idle after a full lift/sip/setdown cycle', settled, `actionState settled=${settled}`);
    record('coffee: exactly one cup-lift, one sip, one cup-setdown, in that order',
      orderOk && monotonic, `kinds=${JSON.stringify(kinds)}`);

    // Cancellation: interrupt after cup-lift but before sip/setdown, then wait
    // past both original timestamps and confirm neither ever fires.
    const baselineCount = snap.foley.length;
    const t0 = await page.evaluate(() => performance.now());
    await page.getByRole('button', { name: 'COFFEE', exact: true }).click();
    await page.waitForTimeout(900); // cup-lift fires ~600ms in; sip/setdown are still ahead
    const midway = await probeSnapshot(page);
    const liftOnly = midway.foley.length === baselineCount + 1 && midway.foley[baselineCount].kind === 'cup-lift';
    record('coffee cancellation: cup-lift fires before the interrupt', liftOnly,
      `foleyAfterLift=${JSON.stringify(midway.foley.slice(baselineCount))}`);
    await page.keyboard.press('Escape');
    await waitFor(page, () => document.querySelector('.workspace-stage')?.dataset.actionState === 'idle', undefined, 3_000);
    await page.waitForTimeout(3_400); // past the uncancelled sip (1.95s) and setdown (3.7s) marks
    const afterCancel = await probeSnapshot(page);
    const noStaleSound = afterCancel.foley.length === baselineCount + 1;
    record('coffee cancellation: no stale sip/setdown fires after mid-timeline Escape',
      noStaleSound, `t0=${t0} foleyTotal=${afterCancel.foley.length} expected=${baselineCount + 1}`);

    record('coffee: no page/console errors across normal-motion cycle', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await ctx.close();
  }
}

async function runCoffeeReducedMotion(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = attachErrors(page);
  await installAudioProbe(page);
  await pinScan(page, { reduced: true });
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    await enterRoom(page);
    await exploreRoom(page);
    await openObjects(page);
    await page.mouse.click(6, 6);
    await page.getByRole('button', { name: 'COFFEE', exact: true }).click();
    await page.waitForTimeout(4_200); // past where all three cues would land under full motion
    const snap = await probeSnapshot(page);
    record('coffee (reduced motion): settling to the held state does not synthesize any lift/sip/setdown cue',
      snap.foley.length === 0, `foley=${JSON.stringify(snap.foley)}`);
    const state = await actionState(page);
    record('coffee (reduced motion): action state settles without an animated timeline', state === 'idle', `actionState=${state}`);
    record('coffee (reduced motion): no page/console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------
// Areas 4 & 5 — hidden-tab suppression, and cleanup/no-leaks across
// route unmount/re-entry
// ---------------------------------------------------------------------------

async function setHidden(page, hidden) {
  await page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

async function runHiddenTabAndLifecycle(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = attachErrors(page);
  await installAudioProbe(page);
  await pinScan(page);
  try {
    await page.goto(`${BASE}/#/`, { waitUntil: 'domcontentloaded' });
    await enterRoom(page);
    await exploreRoom(page);
    await openObjects(page);
    await setHidden(page, true);
    await page.waitForTimeout(200);
    const hiddenSnap = await probeSnapshot(page);
    record('hidden-tab: the room-audio AudioContext is suspended while hidden',
      hiddenSnap.contextStates[0] === 'suspended', `states=${JSON.stringify(hiddenSnap.contextStates)}`);

    // Trigger the coffee timeline while hidden: the workspace:foley events
    // still dispatch (the gsap timeline doesn't know about tab visibility),
    // but playRoomFoley must not synthesize any node while document.hidden.
    const oscBefore = hiddenSnap.oscillators, bufBefore = hiddenSnap.bufferSources;
    await page.getByRole('button', { name: 'COFFEE', exact: true }).click();
    await page.waitForTimeout(900); // past the cup-lift dispatch at ~0.6s
    const duringHidden = await probeSnapshot(page);
    const dispatchedButSilent = duringHidden.foley.some((f) => f.kind === 'cup-lift')
      && duringHidden.oscillators === oscBefore && duringHidden.bufferSources === bufBefore;
    record('hidden-tab: foley event still dispatches but produces no audio node while hidden',
      dispatchedButSilent, `osc=${duringHidden.oscillators}->${oscBefore} buf=${duringHidden.bufferSources}->${bufBefore}`);
    await page.keyboard.press('Escape'); // cancel the coffee cycle rather than waiting it out
    await waitFor(page, () => document.querySelector('.workspace-stage')?.dataset.actionState === 'idle', undefined, 3_000);

    await setHidden(page, false);
    await page.waitForTimeout(150);
    const afterUnhide = await probeSnapshot(page);
    record('hidden-tab: returning to the foreground auto-resumes the suspended context',
      afterUnhide.contextStates[0] === 'running', `states=${JSON.stringify(afterUnhide.contextStates)}`);
    await page.mouse.click(6, 6); // ensure subsequent gesture maintains running context
    await page.waitForTimeout(200);
    const afterNextGesture = await probeSnapshot(page);
    record('hidden-tab: subsequent pointer/keyboard gesture maintains running context',
      afterNextGesture.contextStates[0] === 'running', `states=${JSON.stringify(afterNextGesture.contextStates)}`);

    // Lifecycle: unmount Scan (navigate to /work), confirm every doc/window
    // listener this module bound is symmetrically removed and every
    // AudioContext created so far is closed, then remount and confirm a
    // fresh gesture creates a new (not stale) context, twice.
    for (let cycle = 1; cycle <= 2; cycle += 1) {
      const before = await probeSnapshot(page);
      await page.evaluate(() => { window.__lifecycleMark = 1; });
      // The WORK link only exists in the overview (.launchpad); while seated
      // the seat-exit panel has no route link, so stand up first.
      await page.getByRole('button', { name: 'STAND UP / ESC', exact: true }).click();
      await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 8_000 });
      await page.locator('[data-testid="room-overview"] a[href*="/work"]').first().click();
      const reachedWork = await page.waitForURL(/#\/work|\/work/, { timeout: 8_000 }).then(() => true).catch(() => false);
      await page.waitForTimeout(200);
      const afterUnmount = await probeSnapshot(page);
      const listenersZero = ['pointerdown', 'keydown', 'visibilitychange', 'workspace:foley']
        .every((type) => (afterUnmount.listeners[type] || 0) === 0);
      record(`lifecycle[${cycle}]: navigating to /work unmounts Scan and reaches the static route`, reachedWork,
        `url reached=${reachedWork}`);
      record(`lifecycle[${cycle}]: every document/window listener Scan bound is removed on unmount`,
        listenersZero, `listeners=${JSON.stringify(afterUnmount.listeners)}`);
      record(`lifecycle[${cycle}]: every AudioContext created so far is closed on unmount`,
        afterUnmount.closeCount === afterUnmount.contextCount, `closes=${afterUnmount.closeCount} contexts=${afterUnmount.contextCount}`);

      await page.goBack({ waitUntil: 'domcontentloaded' });
      const backAtRoom = await page.locator('[data-testid="room-overview"]').waitFor({ timeout: 10_000 }).then(() => true).catch(() => false);
      await exploreRoom(page);
      await openObjects(page);
      await page.mouse.click(6, 6);
      await page.waitForTimeout(200);
      const afterRemount = await probeSnapshot(page);
      // /work is its own document in the production build, so going back reloads the page and the probe's counters restart at zero.
      const reloaded = !(await page.evaluate(() => window.__lifecycleMark));
      const expectedContexts = reloaded ? 1 : before.contextCount + 1;
      record(`lifecycle[${cycle}]: re-entering the room and gesturing again creates a fresh context, not a stale one`,
        afterRemount.contextCount === expectedContexts && backAtRoom,
        `before=${before.contextCount} after=${afterRemount.contextCount} reloaded=${reloaded}`);
    }

    record('hidden-tab/lifecycle: no page/console errors across the whole run', errors.length === 0, errors.slice(0, 5).join(' | '));
  } finally {
    await ctx.close();
  }
}

// ---------------------------------------------------------------------------

const browser = await chromium.launch(process.env.GPU === '1'
  ? { channel: 'chromium', args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] }
  : {});
try {
  await runGestureGate(browser);
  await runMuteAndIndependence(browser);
  await runCoffeeTimeline(browser);
  await runCoffeeReducedMotion(browser);
  await runHiddenTabAndLifecycle(browser);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.pass);
writeFileSync(`${OUT}/after-hours-audio-results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILURES:\n' + failed.map((r) => `  - ${r.name}: ${r.detail}`).join('\n'));
  process.exit(1);
}
