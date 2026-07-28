# Open Sea — Realtime WebGPU Ocean

Cinematic procedural ocean matching the Open Sea reference look.

## Run

```bash
cd procedural-ocean
npx serve -l 5173 .
```

Open http://localhost:5173 — requires WebGPU (Chrome / Edge 113+).

## Look

- Low camera over soft Gerstner swell (5 waves)
- Analytic normals + FBM micro-surface detail
- Shared spectral sky (dome + water reflection)
- DAY ↔ DUSK continuous palette
- Sparse crest foam, sun glitter, horizon fade
- TSL Bloom + ACES, Drift orbit, Sea State / Time of Day / FPS
