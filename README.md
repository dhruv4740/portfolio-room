# 3D Portfolio Room

My portfolio as an interactive 3D studio room. The monitor on the desk runs a small OS ("dhruvOS") with live demos of my projects.

**Live:** [dhruvkothari.pages.dev](https://dhruvkothari.pages.dev/) · recruiter view: [/work](https://dhruvkothari.pages.dev/work)

![screenshot](docs/screenshot.png)

## What is interesting here

- **Adapts to the visitor's device.** Detects the GPU and serves a full 3D, a mobile, or a no WebGL version.
- **Holds frame rate on weak laptops.** A GPU timer governor scales render resolution to keep 30 to 60 FPS on integrated graphics.
- **Real apps inside the room.** The in-room OS loads project demos (for example FocusLock's renderer) rather than static images.

## Stack

Three.js, React 19, GSAP, GLSL shaders, Vite, Playwright (visual checks), gltf-transform and sharp (asset pipeline). Deployed on Cloudflare Pages.

## Run

```bash
npm install
npm run dev
npm run build
```

See `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` for how it is put together.
