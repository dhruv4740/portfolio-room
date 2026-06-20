# Required Audio Files

Place the following MP3 files in this directory. Vite serves `public/` at the web root,
so each file is accessible at `/sounds/<filename>` in the browser.

The audio system degrades gracefully — if any file is absent (HTTP 404), Howler logs a
console warning and the app continues silently. No crashes, no broken scene.

| Filename          | Role                                      | Loop  | Volume |
|-------------------|-------------------------------------------|-------|--------|
| `room_day.mp3`    | Ambient background — daytime (06:00–19:59)| yes   | 0.15   |
| `room_night.mp3`  | Ambient background — night (20:00–05:59)  | yes   | 0.15   |
| `keyboard.mp3`    | Keyboard tap on boot typing sequence      | no    | 0.40   |
| `engine.mp3`      | Car engine loop (FOCUSED phase)           | yes   | 0.20   |
| `checkpoint.mp3`  | Checkpoint reached in car game            | no    | 0.60   |
| `paper.mp3`       | Paper stack knocked off desk              | no    | 0.50   |
| `mug_fall.mp3`    | Mug knocked off desk                      | no    | 0.70   |
| `glitch.mp3`      | Boot-sequence glitch reveal moment        | no    | 0.80   |
| `duck.mp3`        | Hidden rubber duck quack (easter egg)     | no    | 0.80   |

## Recommended sources

- Freesound.org (CC0 / Attribution)
- ZapSplat.com
- Pixabay audio library

Keep files under ~200 KB each for fast load.
