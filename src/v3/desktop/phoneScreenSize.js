// Kept apart from PhoneScreen.jsx so the room can project the phone quad
// without pulling the phone UI and its apps into the first load.
export const PHONE_SCREEN = Object.freeze({ width: 540, height: 1200 });
// The stage uses a real portrait CSS viewport. PHONE_SCREEN remains the
// projective surface contract used by the room's WebGL display.
export const PHONE_STAGE = Object.freeze({ width: 390, height: 844 });
// Texture UV origin is bottom-left. Drawing, hover and click tests share this.
// Here rather than in buildWorkspace.js so PhoneScreen doesn't pull three.
export const INSTAGRAM_ICON_UV_RECT = Object.freeze({
  uMin: 205 / 540, uMax: 335 / 540,
  vMin: 1 - 610 / 1200, vMax: 1 - 480 / 1200,
});

// The home-screen apps PhoneScreen opens, in grid order, on the 540 x 1200
// surface. PhoneScreen positions its icons from this list and the room's phone
// texture draws from it, so the two cannot drift.
export const PHONE_HOME_APPS = Object.freeze([
  { id: 'instagram', label: 'Instagram', left: 80, top: 470, size: 130 },
  { id: 'focuslock', label: 'FocusLock', left: 330, top: 470, size: 130 },
  { id: 'expense', label: 'Expense', left: 80, top: 650, size: 130 },
  { id: 'basketproof', label: 'BasketProof', left: 330, top: 650, size: 130 },
  { id: 'contact', label: 'Message', left: 80, top: 830, size: 130 },
  { id: 'blackout', label: 'Blackout', left: 330, top: 830, size: 130 },
].map(Object.freeze));
