// Shared pointer-lock target so CameraRig (which calls requestPointerLock
// inside the user gesture) and PlayerController (which reads lock state) both
// reference the same element without prop-drilling.
// The canvas element is assigned here by CameraRig before requesting lock.

let _element = null

export function setLockTarget(el) {
  _element = el
}

export function requestLock() {
  if (_element) _element.requestPointerLock()
}

export function exitLock() {
  if (document.pointerLockElement) document.exitPointerLock()
}

export function isLocked() {
  return document.pointerLockElement === _element && _element !== null
}
