// The room's authored models are Draco-compressed (docs/HANDOFF.md has the command).
// One decoder, running in workers, serves all of them; its files live in public/draco/,
// copied from three/examples/jsm/libs/draco/gltf/ for the installed three version.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

let draco = null;
export function modelLoader() {
  draco ||= new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`);
  return new GLTFLoader().setDRACOLoader(draco);
}
