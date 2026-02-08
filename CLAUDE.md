# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Island Survival is a 2D procedural survival game built with **Phaser 3.80.1** (frontend) and **Express.js** (backend). The game features procedural terrain generation, LPC sprite-based character animation, day/night cycles, and a save system via REST API.

## Commands

```bash
npm run dev      # Start dev server with file watching (port 3000)
npm start        # Start production server (port 3000)
npm run stop     # Kill node processes (Windows-specific: taskkill)
npm run restart  # Stop + start
```

No test runner, linter, or build/bundle step is configured. The frontend uses vanilla ES6 modules loaded directly via `<script>` tags in `public/index.html`.

## Architecture

### Backend (`server/index.js`)

Express server serving static files from `public/` and a REST API for save game management (`/api/saves`). Game data is stored in an **in-memory Map** (no database). Default player spawns at (2500, 2500) with base stats.

### Frontend (`public/js/`)

Phaser scene-based architecture with two scenes:

- **MenuScene** — Save game management UI with glassmorphism styling, custom modal system, and server API integration
- **GameScene** — Main gameplay: initializes a 20,000x20,000 world, loads LPC character sprites, and orchestrates all game systems

### Core Systems (`public/js/world/`, `player/`, `ui/`)

| System | File | Role |
|--------|------|------|
| **WorldConfig** | `world/WorldConfig.js` | Constants, terrain types, color palettes (12 RGB colors per terrain), texture config |
| **IslandGenerator** | `world/IslandGenerator.js` | Multi-octave Perlin noise terrain on 8000x8000 grid with island falloff; async with progress callback |
| **TerrainRenderer** | `world/TerrainRenderer.js` | Renders terrain to half-res canvas (4000x4000) with dual Perlin noise textures, edge detection, jitter |
| **VegetationManager** | `world/VegetationManager.js` | Procedural tree/rock/flower/bush textures; chunk-based rendering (500px); atmospheric particles; LOD |
| **DayNightCycle** | `world/DayNightCycle.js` | 120-second full day cycle; cloud shadows; dynamic tint overlay |
| **PlayerController** | `player/PlayerController.js` | WASD/arrow movement, sprint (SHIFT), multi-layer sprite container, footprints, dust particles, interaction |
| **AnimationManager** | `player/AnimationManager.js` | Walk (9 frames) and slash (6 frames) animations across 5 sprite layers x 4 directions |
| **HUD** | `ui/HUD.js` | Left sidebar (300px): clock, stats, inventory, day/night indicator, collapsible |

### Key Technical Details

- **Noise library**: `public/js/lib/noise.js` (Perlin/Simplex) — used by terrain generation and rendering
- **LPC sprites**: `public/assets/lpc_entry/png/` — modular character parts (body, armor, feet, legs, torso, head)
- **All terrain and vegetation textures are procedurally generated** at runtime (no external image files except LPC sprites)
- **Async generation**: Heavy operations (terrain gen, rendering) are batched with `setTimeout` yields to avoid blocking the UI
- **Chunk system**: VegetationManager only renders vegetation in chunks near the camera

## Conventions

- ES6 classes, one per file, PascalCase filenames matching class names
- Private methods prefixed with underscore (`_fbm`, `_createAnimations`)
- Constants in UPPER_CASE within WorldConfig
- Comments may be in Spanish or English
- Systems receive the Phaser `scene` reference and manage their own lifecycle
- Phaser Arcade physics with gravity disabled
