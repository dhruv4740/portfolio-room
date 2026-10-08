// Real load progress: each tracked asset reports bytes (or 0/1 when it can
// only say started/finished). Subscribers get the combined fraction.
const tasks = new Map();
const listeners = new Set();

// Tasks report in different units (bytes, item counts), so each is reduced to
// its own fraction; `progress` is their mean.
function snapshot() {
  const fractions = {};
  let sum = 0, weights = 0;
  for (const [name, t] of tasks) { fractions[name] = Math.min(t.loaded / t.total, 1); sum += fractions[name] * t.weight; weights += t.weight; }
  const values = Object.values(fractions);
  return {
    progress: weights ? sum / weights : 0,
    pending: values.filter(f => f < 1).length,
    tasks: fractions,
  };
}

function emit() {
  const s = snapshot();
  listeners.forEach(fn => fn(s));
}

// `weight` counts a task for more than one share of the mean (the shader warm-up is
// most of the wait, so it must move the bar). Later calls keep the weight they set.
export function reportProgress(name, loaded, total, weight) {
  tasks.set(name, { loaded, total: Math.max(total, 1), weight: weight ?? tasks.get(name)?.weight ?? 1 });
  emit();
}

export function subscribeProgress(fn) {
  listeners.add(fn);
  fn(snapshot());
  return () => listeners.delete(fn);
}

// Reads a fetch body while reporting bytes. Falls back to `estimate` when the
// server sends no Content-Length (compressed transfer).
export async function trackedArrayBuffer(name, response, estimate) {
  const total = Number(response.headers.get('content-length')) || estimate;
  if (!response.body?.getReader) {
    const buffer = await response.arrayBuffer();
    reportProgress(name, total, total);
    return buffer;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  reportProgress(name, 0, total);
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    reportProgress(name, loaded, Math.max(total, loaded));
  }
  reportProgress(name, loaded, loaded);
  const out = new Uint8Array(loaded);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.byteLength; }
  return out.buffer;
}
