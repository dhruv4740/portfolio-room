// Custom glitch post-processing fragment shader
// mainImage signature required by postprocessing Effect

uniform float uIntensity;
uniform float uTime;

// Cheap hash: returns pseudo-random float in [0,1)
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // At intensity == 0 → exact passthrough
  if (uIntensity <= 0.0) {
    outputColor = inputColor;
    return;
  }

  float t = uTime;

  // ── (c) Block displacement ─────────────────────────────────────────────
  // Divide screen into N horizontal slices; randomly shift some
  float sliceN = 40.0;
  float row = floor(uv.y * sliceN);
  float sliceRand = hash2(vec2(row, floor(t * 8.0)));
  // Only displace rows where random > threshold driven by intensity
  float dispThresh = 1.0 - uIntensity * 0.65;
  float blockShift = 0.0;
  if (sliceRand > dispThresh) {
    // Amount scales with intensity and the per-row random
    blockShift = (sliceRand - dispThresh) * uIntensity * 0.12;
    // Alternate direction
    blockShift *= (hash(row + 99.1) > 0.5) ? 1.0 : -1.0;
  }

  // ── (a) Per-row jitter for RGB split ──────────────────────────────────
  float jitterRow = floor(uv.y * 200.0);
  float jitter = (hash(jitterRow + t * 13.7) - 0.5) * 0.006 * uIntensity;

  // Base RGB split offsets (horizontal)
  float splitBase = 0.004 * uIntensity;

  vec2 uvR = vec2(uv.x + splitBase + jitter + blockShift, uv.y);
  vec2 uvG = vec2(uv.x + blockShift, uv.y);
  vec2 uvB = vec2(uv.x - splitBase - jitter * 0.5 + blockShift, uv.y);

  // Clamp UVs to [0,1]
  uvR = clamp(uvR, 0.0, 1.0);
  uvG = clamp(uvG, 0.0, 1.0);
  uvB = clamp(uvB, 0.0, 1.0);

  float r = texture2D(inputBuffer, uvR).r;
  float g = texture2D(inputBuffer, uvG).g;
  float b = texture2D(inputBuffer, uvB).b;
  float a = inputColor.a;

  // ── (b) Scanlines ──────────────────────────────────────────────────────
  float scanline = 1.0 - sin(uv.y * 600.0) * 0.04 * uIntensity;

  // ── (d) VHS flicker ───────────────────────────────────────────────────
  float flicker = 1.0 + (hash(floor(t * 20.0)) - 0.5) * 0.06 * uIntensity;

  vec4 glitched = vec4(r, g, b, a) * scanline * flicker;

  // Blend: at intensity 0 → inputColor exactly; at 1 → full glitch
  // (The early return already handles intensity==0, but for sub-1 values
  //  we lerp so the effect gracefully fades in/out.)
  outputColor = mix(inputColor, glitched, uIntensity);
}
