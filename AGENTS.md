# Project Instructions & Agent Guidelines

## 1. Living Source of Truth & Documentation Policy

`AGENTS.md` is the persistent handoff document between AI agents across sessions and turns.

### Mandatory Rules for AI Agents:
1. **Document Only Critical Decisions:**
   - Document ONLY major architectural decisions, environment configurations, breaking fixes, and essential cross-cutting patterns.
   - **DO NOT** record routine conversational steps, incremental build journeys, or trivial UI tweaks. Keep documentation concise, relevant, and actionable.
2. **Review Before Working:**
   - Before implementing changes, review the architecture and guidelines below to avoid breaking container constraints or existing features.

---

## 2. Infrastructure & Core Architecture

### Runtime & Container Environment
- **Platform:** Google AI Studio Cloud Run container.
- **Port & Host Constraints:** Dev server **MUST** bind to `host: '0.0.0.0'` and `port: 3000`. Port 3000 is the only externally accessible port through nginx.
- **HMR:** Platform sets `DISABLE_HMR=true`. File watching is set to `null` to conserve CPU.
- **Production Deployment:** Full-stack Express + Vite. `npm run build` generates static assets in `dist/` and bundles `server.ts` to `dist/server.cjs` via `esbuild`. Production runs via `node dist/server.cjs`.

### Technology Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), `motion/react` (v12), `lucide-react`.
- **Backend:** Express 4 with `tsx` development runner and Google GenAI SDK (`@google/genai`).
- **3D Engine:** Three.js (`three` v0.186.0) with custom toon shaders (`threeHelpers.ts`), procedural meshes (`petGeometries.ts`), and GLTF loader (`petModelLoader.ts`) with `MeshoptDecoder`.
- **Audio:** Web Audio API sound synthesizer (`src/utils/audio.ts`) with zero external sound files.
- **Speech System:** Web Speech API (`speech.ts`) with SpeechRecognition for mic input and SpeechSynthesis for cute high-pitch voice output.
- **AI Service:** Server-side Gemini endpoint `/api/chat` with model fallback (`gemini-flash-latest` -> `gemini-3.8-flash` -> `gemini-3.1-flash-lite`) supporting EN, BN, and HI.

---

## 3. Key Systems & Architectural Milestones

### 1. 50-Species 3D Pet System
- **Species Roster:** 50 distinct species across small pets, birds, aquatic, and prehistoric creatures (e.g. hamster, chinchilla, ferret, hedgehog, otter, owl, parakeet, mammoth, goldfish, etc.). Generic duplicates (dog, bunny, panda) sharing the hamster mesh have been removed.
- **3D Loading Pipeline:** `src/components/3d/petModelLoader.ts` loads models using `GLTFLoader` with `MeshoptDecoder`. Supports both individual optimized GLBs (`/models/*.glb`) and extraction from `pets-compressed.glb`.
- **Dual Visual Modes:** Toggle between authentic 3D GLB models (`textured`) and stylized organic 3D models (`mochi`).
- **Animation System:** Shared `PetNodes` interface supporting idle breathing, walking waddle, 360° dance routines, musical singing, talking mouth chatter with eye blinking, and pet accessories.

### 2. Expanded 3D Pet House
- **Spacious Layout:** 10.5 x 10.5 room with 4 inward-facing walls using `THREE.FrontSide` culling for seamless 360° horizontal rotation without camera clipping.
- **Environment & Furniture:** Interactive pet bed, ceramic food bowl with dynamic treats, crystal water bowl with ripples, toy ball, decor plushie/plants, scenic window, and fairy string lights.
- **Camera & Movement:** Eye-level Talking Tom corner angle (camera radius 6.8, `phi = 1.32`, clamped between `±3.8` floor bounds for tap-to-move).

### 3. Talking Tom 2 Layout & Interaction
- **Top Bar:** Level badge with circular XP progress ring, dark coin capsule balance, Daily Gift button, and Settings.
- **Sub-Ribbon:** Language switch (`[BN] [HI] [EN]`), Pet ID, and Multiplayer room status.
- **Voice Action Bar:**
  - **REPEAT Button:** Continuous mic listening loop. Catches speech, speaks verbatim in high-pitch voice with 3D mouth chatter, and resumes listening without re-tapping.
  - **ANSWER Button:** AI question-answering powered by server-side Gemini in English, Bengali, or Hindi.
- **Bottom Status Dock:** 5 circular glossy buttons: Smiley/Happiness, Kitchen/Food, Bath/Clean, Bedroom/Sleep, and Travel/Games.
