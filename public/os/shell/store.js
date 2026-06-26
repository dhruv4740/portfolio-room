// os/shell/store.js — event bus + light exploration state (localStorage-backed)

const STORAGE_KEY = 'dhruvos.v1';

function loadPersisted() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function savePersisted(explored, misc) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ explored: [...explored], misc })); } catch {}
}

const _listeners = {};
const _persisted = loadPersisted();
const _explored = new Set(_persisted.explored || []);
const _misc = _persisted.misc || {};

function on(event, fn) {
  (_listeners[event] = _listeners[event] || []).push(fn);
  return () => { _listeners[event] = (_listeners[event] || []).filter(f => f !== fn); };
}

function emit(event, payload) {
  (_listeners[event] || []).slice().forEach(fn => fn(payload));
}

function markExplored(appId) {
  if (_explored.has(appId)) return;
  _explored.add(appId);
  savePersisted(_explored, _misc);
  emit('explored:change', { count: _explored.size, appId });
}

function isExplored(appId)          { return _explored.has(appId); }
function exploredCount()            { return _explored.size; }
function exploredRatio(total)       { return total > 0 ? _explored.size / total : 0; }
function get(key)                   { return _misc[key]; }
function set(key, value)            { _misc[key] = value; savePersisted(_explored, _misc); }

export default { on, emit, markExplored, isExplored, exploredCount, exploredRatio, get, set };
