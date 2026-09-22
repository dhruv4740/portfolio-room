// Kept apart from PhoneScreen.jsx so the room can project the phone quad
// without pulling the phone UI and its apps into the first load.
export const PHONE_SCREEN = Object.freeze({ width: 540, height: 1200 });
// The stage uses a real portrait CSS viewport. PHONE_SCREEN remains the
// projective surface contract used by the room's WebGL display.
export const PHONE_STAGE = Object.freeze({ width: 390, height: 844 });
