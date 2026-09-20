import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { WINDOW, BLINDS, MAT, DESK } from './cinematicLayout.js';

// Cinematic-room interactions. A candidate copy of buildRoomInteractions.js at
// true metre scale — the live file is untouched and still used by the live
// builder. The returned shape is identical, so buildCinematicWorkspace and
// WorkspaceStage's action wiring can consume either one.
//
// The procedural props (mug, frame, drawer, pencil, headphones, blind cord)
// were modelled for the old ~1.6x room. Rather than rewrite 60 literals by
// hand, each prop group carries PROP_SCALE and only the world-space travels,
// the blinds and the window sash are re-authored against cinematicLayout.
export const PROP_SCALE = 0.625;
export const AWARD_REST = [-0.12, 0.62, 0];
export const PEN_REST = [0, 0.187, 0];
export const KEY_ROWS = ['1234567890-=', 'qwertyuiop[]', "asdfghjkl;'\\", 'zxcvbnm,./   ', '            '];

// World-space travels, re-derived for this room.
export const DRAWER_TRAVEL = 0.29;
export const SASH_TRAVEL = (WINDOW.opening.maxX - WINDOW.opening.minX) * 0.40;

export function buildCinematicRoomInteractions({
  root, materials: m, canvasTexture, anchors, achievements, bulb, lampInterior,
  lampPool, moon, moonOpen, blindsGroup, keys, keyConfig, windowLight,
}) {
  const objects = {};
  function group(id, scale = PROP_SCALE) {
    const g = new THREE.Group(); g.position.set(...anchors[id]); g.scale.setScalar(scale);
    g.name = id; objects[id] = g; root.add(g); return g;
  }
  function mesh(g, geometry, material, position = [0, 0, 0], id = g.name) {
    const o = new THREE.Mesh(geometry, material); o.position.set(...position);
    o.receiveShadow = true; o.castShadow = false; o.userData.anchorId = id; g.add(o); return o;
  }
  function box(g, size, position, material = m.dark) {
    return mesh(g, new RoundedBoxGeometry(...size, 2, 0.008), material, position);
  }

  const lamp = group('lamp'); const toggle = box(lamp, [0.055, 0.025, 0.075], [0, 0, 0]);

  const coffee = group('coffee');
  const ceramic = new THREE.MeshPhysicalMaterial({ color: '#c4b9a2', roughness: .24, metalness: 0, clearcoat: .42, clearcoatRoughness: .18 });
  const profile = [[0, -.070], [.047, -.070], [.049, -.068], [.050, -.064], [.059, -.064], [.066, -.060], [.071, -.050], [.073, .061], [.074, .069], [.073, .073], [.070, .075], [.067, .073], [.065, .069], [.064, -.043], [.061, -.050], [.054, -.053], [0, -.053]];
  mesh(coffee, new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(...p)), 64), ceramic);
  const handle = mesh(coffee, new THREE.TorusGeometry(0.044, 0.011, 16, 40, Math.PI), ceramic, [-0.043, 0.008, 0.043]);
  handle.rotation.set(0, Math.PI / 4, Math.PI / 2);
  // The lathe profile's base is 0.070 below the group origin, so the group has
  // to be lifted by that much (times the prop scale) to stand on the desk.
  coffee.position.y += 0.070 * PROP_SCALE;
  const liquidUniforms = { time: { value: 0 }, amplitude: { value: 0 } };
  const liquidMaterial = new THREE.MeshStandardMaterial({ color: '#281307', roughness: 0.23, metalness: 0 });
  liquidMaterial.onBeforeCompile = shader => {
    shader.uniforms.sloshTime = liquidUniforms.time; shader.uniforms.sloshAmplitude = liquidUniforms.amplitude;
    shader.vertexShader = 'uniform float sloshTime; uniform float sloshAmplitude;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      float r2=0.061*0.061; float edge=max(0.0,1.0-dot(position.xy,position.xy)/r2);
      float wave=sin(position.x*65.0+sloshTime*8.0)+0.45*cos(position.y*92.0-sloshTime*6.0);
      float dx=sloshAmplitude*(edge*65.0*cos(position.x*65.0+sloshTime*8.0)-2.0*position.x/r2*wave);
      float dy=sloshAmplitude*(-edge*41.4*sin(position.y*92.0-sloshTime*6.0)-2.0*position.y/r2*wave);
      objectNormal=normalize(vec3(-dx,-dy,1.0));`);
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float rim = max(0.0, 1.0 - dot(position.xy, position.xy) / (0.061*0.061));
      transformed.z += sloshAmplitude * rim * (sin(position.x*65.0+sloshTime*8.0) + 0.45*cos(position.y*92.0-sloshTime*6.0));`);
  };
  const liquid = mesh(coffee, new THREE.RingGeometry(0, 0.061, 48, 12), liquidMaterial, [0, 0.049, 0]);
  liquid.rotation.x = -Math.PI / 2;

  const award = group('award'); award.rotation.set(...AWARD_REST);
  box(award, [0.26, 0.33, 0.02], [0, 0.165, 0], m.wood);
  // The kickstand length is solved for the foot to land on the desk plane
  // *after* AWARD_REST's -0.12 tilt is applied to the group, which is what the
  // inherited 0.300 missed: the tilt swings the foot backward and down, and the
  // frame sank 6.5 mm into the desk in the first render.
  //   y' = (0.135 - (L/2)cos.35 - .006 sin.35)cos.12 + (-0.06 - (L/2)sin.35)sin.12 = 0
  const STRUT_LENGTH = 0.256;
  const strut = box(award, [0.03, STRUT_LENGTH, 0.012], [0, 0.135, -0.06], m.wood); strut.rotation.x = -0.35;
  const awardTexture = canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#eee8d5'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#282b29'; ctx.textAlign = 'center';
    ctx.font = 'bold 56px serif'; ctx.fillText('HACKATHONS', w / 2, 110);
    let y = 225;
    for (const a of achievements) {
      ctx.font = 'bold 36px sans-serif'; ctx.fillText(a.result.toUpperCase() + ' · ' + a.year, w / 2, y); y += 52;
      ctx.font = '28px sans-serif'; let row = '';
      for (const word of a.label.split(' ')) {
        const next = row ? row + ' ' + word : word;
        if (ctx.measureText(next).width > w - 100) { ctx.fillText(row, w / 2, y); y += 38; row = word; } else row = next;
      }
      ctx.fillText(row, w / 2, y); y += 110;
    }
  }, 1000, 1300);
  mesh(award, new THREE.PlaneGeometry(0.235, 0.305), new THREE.MeshBasicMaterial({ map: awardTexture, toneMapped: false }), [0, 0.165, 0.011]);
  // Whatever corner the tilt leaves lowest, seat it on the desk. Measured here
  // rather than solved per-part, so the frame cannot sink again if the rest
  // pose or the kickstand angle is retuned. Runs before `homes` is captured,
  // so the interaction's return-to-rest uses the corrected position.
  {
    const box3 = new THREE.Box3().setFromObject(award);
    if (!box3.isEmpty()) award.position.y += Math.max(0, anchors.award[1] - box3.min.y);
  }

  const drawer = group('drawer');
  box(drawer, [0.61, 0.14, 0.045], [0, 0, 0], m.wood);
  box(drawer, [0.60, 0.025, 0.48], [0, -0.065, -0.23], m.wood);
  for (const x of [-0.285, 0.285]) box(drawer, [0.025, 0.13, 0.48], [x, 0, -0.23], m.wood);
  box(drawer, [0.15, 0.018, 0.025], [0, 0, 0.038]);
  const pageTexture = new THREE.TextureLoader().load('/resume-page.jpg');
  pageTexture.colorSpace = THREE.SRGBColorSpace; pageTexture.anisotropy = 8;
  const resumePage = new THREE.Group(); resumePage.name = 'resumePage';
  resumePage.position.set(0, -0.047, -0.23); drawer.add(resumePage);
  const pagePlane = mesh(resumePage, new THREE.PlaneGeometry(0.21, 0.21 * 3300 / 2550),
    new THREE.MeshBasicMaterial({ map: pageTexture, toneMapped: false, side: THREE.DoubleSide }), [0, 0, 0], 'drawer');
  pagePlane.rotation.x = -Math.PI / 2;

  const pen = group('pen'); pen.rotation.set(...PEN_REST);
  const penBody = mesh(pen, new THREE.CylinderGeometry(0.0075, 0.0075, 0.33, 6), new THREE.MeshStandardMaterial({ color: '#d9a441', roughness: 0.6 }), [0, 0, 0.2]);
  penBody.rotation.x = Math.PI / 2;
  const penTip = mesh(pen, new THREE.ConeGeometry(0.0075, 0.035, 6), new THREE.MeshStandardMaterial({ color: '#e6cfa2', roughness: 0.8 }), [0, 0, 0.0175]);
  penTip.rotation.x = -Math.PI / 2;

  // Blind cord and wand, at the new opening's right jamb.
  const blinds = group('blinds');
  mesh(blinds, new THREE.CylinderGeometry(0.004, 0.004, 0.85, 8), m.bone, [0, 0.2, 0]);
  const cord = mesh(blinds, new THREE.CapsuleGeometry(0.016, 0.055, 4, 12), m.dark, [0, -0.25, 0]);

  // Headphones lie flat, band rotated into the desk plane. The contact is the
  // underside of the earcups, so every local Y is half a cup (0.0425) and the
  // set rests exactly on the anchor plane. The first render floated it 45 mm
  // because the parts were lifted to the band radius (0.115) instead; the live
  // room has the opposite residual — its parts sit at local 0, which leaves the
  // cups 32.5 mm clear of the desk because its anchor is raised.
  const headphones = group('headphones');
  const cupHalf = 0.0425;
  const band = mesh(headphones, new THREE.TorusGeometry(0.115, 0.012, 10, 40, Math.PI), m.dark, [0, cupHalf, 0]);
  band.rotation.x = -Math.PI / 2;
  for (const x of [-0.115, 0.115]) box(headphones, [0.055, 0.085, 0.09], [x, cupHalf, 0], m.dark);

  // Sliding sash, authored against the aperture rather than scaled from the
  // old one: half the opening wide, a 22 mm frame, and glass at 0.18 opacity
  // so the reveal stays a window rather than a mirror.
  const sash = group('windowOpen', 1);
  const sashZ = 0.02;
  const sw = (WINDOW.opening.maxX - WINDOW.opening.minX) / 2 - 0.01;
  const sh = WINDOW.opening.maxY - WINDOW.opening.minY - 0.02;
  const sashFrame = new THREE.MeshStandardMaterial({ color: '#20242a', roughness: 0.5, metalness: 0.3 });
  box(sash, [sw, 0.022, 0.022], [0, sh / 2, sashZ], sashFrame);
  box(sash, [sw, 0.022, 0.022], [0, -sh / 2, sashZ], sashFrame);
  box(sash, [0.022, sh, 0.022], [-sw / 2, 0, sashZ], sashFrame);
  box(sash, [0.022, sh, 0.022], [sw / 2, 0, sashZ], sashFrame);
  box(sash, [0.014, 0.06, 0.022], [-sw / 2 + 0.014, 0, sashZ + 0.014], m.dark);
  const glassMat = new THREE.MeshStandardMaterial({ color: '#c5d9eb', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.18, depthWrite: false });
  mesh(sash, new THREE.PlaneGeometry(sw - 0.02, sh - 0.02), glassMat, [0, 0, sashZ]);

  const state = { lamp: 1, blinds: 0, drawer: 0, headphones: 0, coffeeLevel: 1, windowOpen: 0 };
  const homes = Object.fromEntries(Object.entries(objects).map(([id, g]) => [id, g.position.clone()]));

  const labels = canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#d3d0c3'; ctx.fillRect(0, 0, w, h); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#353936'; ctx.font = '36px sans-serif';
    for (let row = 0; row < 5; row++) for (let col = 0; col < 12; col++)
      ctx.fillText(KEY_ROWS[row][col].toUpperCase(), (col + 0.5) * w / 12, (5 - row + 0.5) * h / 6);
  }, 1536, 768);
  keys.material.map = labels; keys.material.color.set('#ffffff');
  keys.geometry.setAttribute('keySlot', new THREE.InstancedBufferAttribute(Float32Array.from({ length: keys.count }, (_, i) => (i < 60 ? i : 60)), 1));
  keys.material.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute float keySlot;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>',
      '#include <uv_vertex>\n vMapUv = (vMapUv + vec2(mod(keySlot,12.0),floor(keySlot/12.0))) / vec2(12.0,6.0);');
  };
  const keyMatrix = new THREE.Matrix4(); const keyHomes = [];
  for (let i = 0; i < keys.count; i++) { keys.getMatrixAt(i, keyMatrix); keyHomes.push(keyMatrix.clone()); }
  function setKey(index, depth) {
    if (index < 0 || index >= 60) return;
    keyMatrix.copy(keyHomes[index]); keyMatrix.elements[13] -= depth;
    keys.setMatrixAt(index, keyMatrix); keys.instanceMatrix.needsUpdate = true;
  }

  const levelRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  function updateLiquid(time, energy) {
    liquidUniforms.time.value = time; liquidUniforms.amplitude.value = energy * 0.004;
    liquid.visible = state.coffeeLevel > 0;
    liquid.position.y = -0.043 + 0.092 * state.coffeeLevel;
    liquid.quaternion.copy(coffee.quaternion).invert().multiply(levelRotation);
  }

  function apply() {
    bulb.intensity = (bulb.userData.onIntensity ?? 1.85) * state.lamp;
    lampPool.material.opacity = 0.38 * state.lamp;
    lampInterior.material.color.set(state.lamp > 0.5 ? '#d6a26b' : '#29251e');
    toggle.rotation.x = (1 - state.lamp) * 0.28;
    blindsGroup.children.forEach((s, i) => {
      s.rotation.x = THREE.MathUtils.lerp(BLINDS.closedTilt, BLINDS.openTilt, state.blinds);
      s.position.y = BLINDS.headY - i * THREE.MathUtils.lerp(BLINDS.closedPitch, BLINDS.openPitch, state.blinds);
    });
    const closed = keyConfig?.closed ?? 1.15; const open = keyConfig?.open ?? 1.60;
    moon.intensity = closed * (1 - state.blinds);
    moonOpen.intensity = open * state.blinds;
    drawer.position.z = homes.drawer.z + state.drawer * DRAWER_TRAVEL;
    if (objects.windowOpen) objects.windowOpen.position.x = homes.windowOpen.x - state.windowOpen * SASH_TRAVEL;
    if (windowLight) windowLight.intensity = (keyConfig?.windowLight ?? 0.55) * state.windowOpen;
  }

  return { objects, homes, state, cord, apply, updateLiquid, setKey, liquid, liquidUniforms, blindsGroup, resumePage };
}

// Re-exported so a consumer can place the desk-bound props without importing
// two modules; both are read-only views of cinematicLayout.
export { MAT, DESK };
