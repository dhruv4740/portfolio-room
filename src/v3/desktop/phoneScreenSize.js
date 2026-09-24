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
