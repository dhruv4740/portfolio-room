// Prints the true-scale room numbers bake_true_scale_room.py needs, as JSON.
import { ROOM, WINDOW, DESK, MONITOR, SCREEN, SPEAKER, ANCHORS } from '../../src/v3/desktop/cinematicLayout.js';

// authoredTaskLamp.js: bulb at mount-local (-.14886, .491, .07183); the mount
// is rotated +90deg about y and placed at (ANCHORS.lamp x, desk top, lamp z).
const [mx, , mz] = ANCHORS.lamp;
const lampBulb = [mx + 0.07183, DESK.topY + 0.491, mz + 0.14886];

console.log(JSON.stringify({ room: ROOM, window: WINDOW, desk: DESK, monitor: MONITOR, screen: SCREEN, speaker: SPEAKER, lampBulb }));
