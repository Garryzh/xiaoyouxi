# GARGANTUA — Schwarzschild Black Hole Raytracer

Real-time null-geodesic raytracing of a Schwarzschild black hole. Fullscreen fragment-shader integration — no mesh fakes, no disk textures, no video.

## Run

```bash
cd gargantua
npx serve -l 5175 .
```

Open http://localhost:5175 — WebGL2 recommended (Chrome / Edge / Firefox).

## Features

- Schwarzschild null geodesics (event horizon, photon ring, multi-pass disk)
- Procedural accretion turbulence, Doppler boost, gravitational redshift
- Lensed galaxy + starfield background
- HDR bloom, ACES tonemap, vignette, film grain, chromatic aberration
- Cinematic camera loop, OrbitControls, four view presets
- Mission HUD, 21 live parameters, debug views 0–9
- Quality tiers: Standard / High / Cinematic
- Optional ambience (`audio/`), localStorage persistence, WebGL fault recovery
- URL screenshot mode for automation

## URL params

| Param | Meaning |
|-------|---------|
| `?q=standard\|high\|cinematic` | Quality tier |
| `?steps=60..600` | Override geodesic steps |
| `?cam=poster\|edge\|polar\|close` | Start camera |
| `?nocine` | Disable cinematic default |
| `?ctime=seconds` | Cinematic time offset |
| `?debug=0..9` | Debug view |
| `?shot` | Hide intro, freeze after a few frames, set `document.title = SHOT_OK` |

Example: `http://localhost:5175/?shot&cam=poster&q=high`

## Keys

`1–4` views · `C` cinematic · `R` / `O` orbit · `Q` quality · `P` params · `M` sound · `H` HUD · `0–9` debug

## Stack

Three.js r164 (vendored) · ES modules · no build step
