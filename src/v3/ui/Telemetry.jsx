// ============================================================================
// Telemetry.jsx — a small, user-facing status readout for the modeled room.
//
// The scan surface no longer downloads or decodes a capture, so this keeps the
// useful performance signal (measured frame cadence) and names the medium
// honestly. It intentionally omits renderer internals and asset diagnostics.
// ============================================================================

const DASH = '—';

function isNum(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function fmtFixed(value, digits = 1) {
  return isNum(value) ? value.toFixed(digits) : DASH;
}

function fmtFps(frameMs) {
  if (!isNum(frameMs) || frameMs <= 0) return DASH;
  return Math.round(1000 / frameMs).toString();
}

function fmtAnchor(anchorId) {
  return anchorId && typeof anchorId === 'string' ? anchorId.toUpperCase() : DASH;
}

// gpuMs is graphics-card time per frame from a GL timer query; it is absent
// in browsers without the extension and never derived from frame cadence.
export default function Telemetry({ frameMs, gpuMs, anchorId, compact = false }) {
  if (compact) {
    return (
      <>
        <style>{CSS}</style>
        <div className="telemetry-root telemetry-root--compact" aria-live="off">
          <span className="t-line">
            <span className="t-item">
              <span className="t-key">WORKSPACE</span>
              <span className="t-val">MODELED REALTIME</span>
            </span>
            <span className="t-sep">&middot;</span>
            <span className="t-item">
              <span className="t-key">FPS</span>
              <span className="t-val">{fmtFps(frameMs)}</span>
            </span>
            {isNum(gpuMs) && (
              <>
                <span className="t-sep">&middot;</span>
                <span className="t-item">
                  <span className="t-key">GPU</span>
                  <span className="t-val">{fmtFixed(gpuMs, 1)} MS</span>
                </span>
              </>
            )}
            {anchorId && (
              <>
                <span className="t-sep">&middot;</span>
                <span className="t-item">
                  <span className="t-key">FOCUS</span>
                  <span className="t-val">{fmtAnchor(anchorId)}</span>
                </span>
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
        <div className="t-row t-row--flag">
          <span className="t-key">WORKSPACE</span>
          <span className="t-flag">MODELED REALTIME</span>
        </div>
        <div className="t-row">
          <span className="t-key">FPS</span>
          <span className="t-val">{fmtFixed(frameMs, 1)} MS &middot; {fmtFps(frameMs)}</span>
        </div>
        {isNum(gpuMs) && (
          <div className="t-row">
            <span className="t-key">GPU</span>
            <span className="t-val">{fmtFixed(gpuMs, 1)} MS</span>
          </div>
        )}
        {anchorId && (
          <div className="t-row">
            <span className="t-key">FOCUS</span>
            <span className="t-val">{fmtAnchor(anchorId)}</span>
          </div>
        )}
      </div>
    </>
  );
}

const CSS = `
.telemetry-root {
  position: fixed;
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

.telemetry-root .t-key { color: var(--dim); }
.telemetry-root .t-val { color: var(--bone); }
.telemetry-root .t-flag { color: var(--signal); font-weight: 500; }

.telemetry-root--compact { flex-direction: row; }
.telemetry-root--compact .t-line {
  display: flex;
  align-items: baseline;
  gap: 0.6em;
}
.telemetry-root--compact .t-item { display: inline-flex; gap: 0.4em; }
.telemetry-root--compact .t-sep { color: var(--faint); }
.telemetry-root--compact .t-val { color: var(--bone); }
`;
