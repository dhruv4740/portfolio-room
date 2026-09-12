// ============================================================================
// Telemetry.jsx — fixed corner instrument readout.
// Presentational only: receives live numbers via props, owns no 3D logic.
//
// Props:
//   splatCount  number   — total gaussian splat count
//   frameMs     number   — average rAF callback interval in ms (presentation cadence)
//   cpuMs       number   — average CPU-side rig update + render submission time
//   gpuMs       number   — measured GPU duration; null/undefined when unavailable
//   loadedMB    number   — bytes loaded, in MB
//   totalMB     number   — total asset size, in MB
//   cameraPos   {x,y,z} | [x,y,z] — live camera position, splat-space metres
//   anchorId    string   — id of the currently active/selected anchor
//   capture     { isPlaceholder, label, ... } — from content/capture
//   compact     boolean  — collapse to a single line
// ============================================================================

const DASH = '—'; // —

function isNum(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function fmtInt(n) {
  if (!isNum(n)) return DASH;
  return Math.round(n).toLocaleString('en-US');
}

function fmtFixed(n, digits = 1) {
  if (!isNum(n)) return DASH;
  return n.toFixed(digits);
}

function fmtFps(frameMs) {
  if (!isNum(frameMs) || frameMs <= 0) return DASH;
  return Math.round(1000 / frameMs).toString();
}

function toXYZ(cameraPos) {
  if (!cameraPos) return null;
  if (Array.isArray(cameraPos)) {
    const [x, y, z] = cameraPos;
    return { x, y, z };
  }
  if (isNum(cameraPos.x) || isNum(cameraPos.y) || isNum(cameraPos.z)) {
    return { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z };
  }
  return null;
}

function fmtCamera(cameraPos) {
  const xyz = toXYZ(cameraPos);
  if (!xyz) return DASH;
  const x = isNum(xyz.x) ? xyz.x.toFixed(2) : DASH;
  const y = isNum(xyz.y) ? xyz.y.toFixed(2) : DASH;
  const z = isNum(xyz.z) ? xyz.z.toFixed(2) : DASH;
  return `${x} ${y} ${z}`;
}

function fmtLoad(loadedMB, totalMB) {
  const loaded = isNum(loadedMB) ? fmtFixed(loadedMB, 1) : DASH;
  const total = isNum(totalMB) ? fmtFixed(totalMB, 1) : DASH;
  if (loaded === DASH && total === DASH) return DASH;
  return `${loaded} / ${total} MB`;
}

function fmtAnchor(anchorId) {
  if (!anchorId || typeof anchorId !== 'string') return DASH;
  return anchorId.toUpperCase();
}

export default function Telemetry({
  splatCount,
  frameMs,
  cpuMs,
  gpuMs,
  loadedMB,
  totalMB,
  cameraPos,
  anchorId,
  capture,
  compact = false,
}) {
  const showPlaceholderFlag = Boolean(capture && capture.isPlaceholder && capture.label);

  if (compact) {
    return (
      <>
        <style>{CSS}</style>
        <div className="telemetry-root telemetry-root--compact" aria-live="off">
          <span className="t-line">
            <span className="t-item">
              <span className="t-key">SPLATS</span>
              <span className="t-val">{fmtInt(splatCount)}</span>
            </span>
            <span className="t-sep">&middot;</span>
            <span className="t-item">
              <span className="t-key">FPS</span>
              <span className="t-val">{fmtFps(frameMs)}</span>
            </span>
            <span className="t-sep">&middot;</span>
            <span className="t-item">
              <span className="t-key">CPU</span>
              <span className="t-val">{fmtFixed(cpuMs, 1)} MS</span>
            </span>
            <span className="t-sep">&middot;</span>
            <span className="t-item">
              <span className="t-key">ANCHOR</span>
              <span className="t-val">{fmtAnchor(anchorId)}</span>
            </span>
            {showPlaceholderFlag && (
              <>
                <span className="t-sep">&middot;</span>
                <span className="t-flag">{capture.label}</span>
              </>
            )}
          </span>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="telemetry-root" aria-live="off">
        {showPlaceholderFlag && (
          <div className="t-row t-row--flag">
            <span className="t-flag">{capture.label}</span>
          </div>
        )}
        <div className="t-row">
          <span className="t-key">SPLATS</span>
          <span className="t-val">{fmtInt(splatCount)}</span>
        </div>
        <div className="t-row">
          <span className="t-key">RAF</span>
          <span className="t-val">
            {fmtFixed(frameMs, 1)} MS &middot; {fmtFps(frameMs)} FPS
          </span>
        </div>
        <div className="t-row">
          <span className="t-key">CPU</span>
          <span className="t-val">{fmtFixed(cpuMs, 1)} MS</span>
        </div>
        <div className="t-row">
          <span className="t-key">GPU</span>
          <span className="t-val">{fmtFixed(gpuMs, 1)} MS</span>
        </div>
        <div className="t-row">
          <span className="t-key">LOAD</span>
          <span className="t-val">{fmtLoad(loadedMB, totalMB)}</span>
        </div>
        <div className="t-row">
          <span className="t-key">CAM</span>
          <span className="t-val">{fmtCamera(cameraPos)}</span>
        </div>
        <div className="t-row">
          <span className="t-key">ANCHOR</span>
          <span className="t-val">{fmtAnchor(anchorId)}</span>
        </div>
      </div>
    </>
  );
}

const CSS = `
.telemetry-root {
  position: fixed;
  /* Bottom-left: the masthead owns the top-left corner on the scan surface. */
  bottom: var(--gutter);
  left: var(--gutter);
  z-index: var(--z-hud);
  display: flex;
  flex-direction: column;
  gap: 0.35em;
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  letter-spacing: var(--track-data);
  text-transform: uppercase;
  color: var(--dim);
  pointer-events: none;
  user-select: none;
}

.telemetry-root .t-row {
  display: flex;
  align-items: baseline;
  gap: 0.75em;
}

.telemetry-root .t-row--flag {
  margin-bottom: 0.15em;
  padding-bottom: 0.35em;
  border-bottom: var(--hair) solid var(--faint);
}

.telemetry-root .t-key {
  min-width: 4.5em;
  color: var(--dim);
}

.telemetry-root .t-val {
  color: var(--bone);
}

.telemetry-root .t-flag {
  color: var(--signal);
  font-weight: 500;
}

.telemetry-root--compact {
  flex-direction: row;
}

.telemetry-root--compact .t-line {
  display: flex;
  align-items: baseline;
  gap: 0.6em;
}

.telemetry-root--compact .t-item {
  display: inline-flex;
  gap: 0.4em;
}

.telemetry-root--compact .t-key {
  min-width: 0;
  color: var(--dim);
}

.telemetry-root--compact .t-val {
  color: var(--bone);
}

.telemetry-root--compact .t-sep {
  color: var(--faint);
}

.telemetry-root--compact .t-flag {
  color: var(--signal);
  font-weight: 500;
}
`;
