# Project Instructions & Agent Guidelines

## 1. Living Source of Truth & Handoff Policy

`AGENTS.md` is a living, continuously maintained source of project context for all AI agents working on this codebase.

### Mandatory Rules for AI Agents:
1. **Continuous Maintenance & Handoff:**
   - AGENTS.md serves as the persistent handoff document between AI agents across sessions and turns. Important project knowledge must never be left solely in conversational memory.
   - Whenever an AI agent makes an important change, discovers a significant issue, introduces a new architectural decision, changes an important configuration, modifies a critical workflow, fixes a non-obvious bug, or encounters anything else that another AI agent needs to know in order to work safely and correctly, the agent **MUST** document it in `AGENTS.md`.
2. **Concise, Actionable Information:**
   - Keep entries clear, relevant, and actionable.
   - Record only information that is critical for future agents to understand the current state of the project, avoid repeating known mistakes, preserve architectural decisions, or continue development smoothly.
3. **Mandatory Review Before Starting Work:**
   - Before implementing changes, every AI agent **MUST** review the relevant sections of `AGENTS.md` and adhere to the accumulated context, guidelines, and architecture.

---

## 2. Current Infrastructure & Architecture

### Runtime & Hosting Environment
- **Platform:** Google AI Studio Cloud Run sandboxed container.
- **Port & Host Constraints:** External traffic is strictly routed to **Port 3000** through an nginx reverse proxy. The dev server **MUST** bind to `host: '0.0.0.0'` and `port: 3000`.
- **HMR Behavior:** Hot Module Replacement is disabled via the platform environment variable `DISABLE_HMR=true`. File watching is set to `null` when `DISABLE_HMR=true` to save CPU cycles and avoid preview flickering.
- **Production Deployment:** Single-Page Application (SPA). `npm run build` outputs static files into `dist/`, served by the platform's auto-injected static file server. (No custom `start` script is needed).

### Technology Stack
- **Framework:** React 19 (`react`, `react-dom`) with TypeScript (ESNext/ES2022, bundler module resolution).
- **Bundler:** Vite 6 (`@vitejs/plugin-react`).
- **Styling:** Tailwind CSS v4 integrated using `@tailwindcss/vite` and `@import "tailwindcss";` in `src/index.css`.
- **3D Graphics:** Three.js (`three` v0.186.0) with custom procedural geometries and shaders (`src/components/3d/`).
- **Animation:** `motion` (v12) imported from `motion/react`.
- **Icons:** `lucide-react`.
- **Effects:** `canvas-confetti`.
- **Audio:** Client-side procedural Web Audio API sound generator (`src/utils/audio.ts`), zero external audio asset dependencies.
- **State Management & Persistence:** Local storage persistence (`localStorage`) through `src/utils/storage.ts`.

### Key Configurations
- **`vite.config.ts`:**
  - `server.host`: `'0.0.0.0'`
  - `server.port`: `3000`
  - `server.allowedHosts`: `true as const` (strictly typed for TS compatibility)
  - Path alias: `@/` maps to root `./`
- **`package.json`:**
  - `"dev"`: `"vite --host 0.0.0.0 --port 3000"`
  - `"build"`: `"vite build"`
  - `"lint"`: `"tsc --noEmit"`

---

## 3. Important Decisions & Past Fixes Log

| Date | Category | Summary | Notes / Actionable Guidance |
|------|----------|---------|-----------------------------|
| 2026-09-17 | Environment | Repository Migration to AI Studio | Cleaned up conflicting lockfiles (`bun.lock`), verified TypeScript config, and configured Vite dev server for `0.0.0.0:3000` with `allowedHosts: true as const`. |
| 2026-09-17 | Documentation | Established Living AGENTS.md Policy | Mandated agent handoff and documentation protocols for all future sessions. |
| 2026-09-17 | Feature | Tap-to-Move, Dance & Sing Talents | 1) Added floor raycasting for tap-to-move with pulsing target ring, smooth movement deceleration, and footstep particles. 2) Added Dance routine with dynamic 360° spin leaps, dance music generator, and sparkles. 3) Added Sing routine with melodic song, animated mouth group, swaying body posture, and musical notes. 4) Added Dance and Sing action buttons to HomeScreen with happiness/XP rewards. |
| 2026-09-17 | Feature | Multiplayer & Mini-Games Integration | 1) Unique Pet ID displayed at the top header. 2) Multiplayer button with Create Room (6-digit code) and Join Room (code entry). 3) Real-time sync using BroadcastChannel & localStorage simulation for instant cross-tab or single-tab friend demo. 4) 3D dual-hamster scene rendering both pets in the same pink room with friend name tag sprite. 5) Mini-Games suite with Race, Hide & Seek, and Ball Play (including 3D interactive play ball). 6) Synchronized actions across rooms for dances, singing, and movement. |
| 2026-09-17 | Feature | Talking Feature (Repeat & Chat in BN/HI/EN) | 1) Added 3 top language buttons: [BN], [HI], [EN] with instant greeting in selected language. 2) Added 2 bottom action buttons: Repeat and Chat. 3) Web Speech API SpeechSynthesis with high pitch (1.5) for cute hamster voice. 4) SpeechRecognition with microphone voice input & fallback typing. 5) Synchronized 3D mouth chatter and cute posture animation in `PetScene3D.tsx`. 6) Dynamic floating speech bubble above hamster with multilingual responses. 7) Added `microphone` frame permission to `metadata.json`. |
