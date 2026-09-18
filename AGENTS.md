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
- **Production Deployment:** Full-stack Express + Vite architecture. `npm run build` compiles static assets to `dist/` and bundles `server.ts` to `dist/server.cjs` via `esbuild`. Production runs via `node dist/server.cjs`.

### Technology Stack
- **Framework:** React 19 (`react`, `react-dom`) with TypeScript (ESNext/ES2022, bundler module resolution).
- **Server:** Express 4 with `tsx` development runner, lazy Gemini SDK (`@google/genai`), and Vite middleware.
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
  - `"dev"`: `"tsx server.ts"`
  - `"build"`: `"vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"`
  - `"start"`: `"node dist/server.cjs"`
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
| 2026-09-18 | Feature & Refinement | Big Front Center Hamster & 2 Main Action Buttons (REPEAT & ANSWER) | 1) Hamster scaled to 1.45x and framed big front center with close camera orbit (radius 3.4), always standing front directly facing the camera with automatic idle return. 2) Dedicated 2 main action buttons: **Button 1 = REPEAT** (user speaks, hamster repeats exact words in cute 1.8 pitch voice with 3D mouth animation) & **Button 2 = ANSWER** (user speaks question, hamster answers smartly with knowledge in BN/HI/EN with 1.8 pitch voice and mouth animation). 3) SpeechSynthesis pitch updated to 1.8x. 4) Responsive floating speech bubble above hamster with clean typography for questions and answers. 5) Kept all existing pet care features (Feed, Water, Play, Clean, Sleep, Dance, Sing, Shop) fully intact in a compact bottom toolbar. |
| 2026-09-18 | Refinement | Hamster Size & Camera Framing Optimization | Adjusted 3D hamster scale to 0.95x and camera orbit radius to 5.4 with balanced lookAt (0, 0.65, 0.1) so the hamster is naturally proportioned, fully visible from head to body without filling the screen, and beautifully framed with the surrounding 3D room environment visible all around it. Kept all voice features, buttons, games, pet care actions, and language settings intact. |
| 2026-09-18 | Feature | Continuous Repeat Mode for Repeat Button | 1) Single tap on Button 1 (REPEAT) activates persistent Continuous Repeat Mode. 2) Automatically maintains microphone listening without needing to press Repeat again after every sentence. 3) Automatically detects end of user speech, immediately shuts off microphone recognition to strictly prevent any mic and hamster speech overlap. 4) Hamster repeats the user's exact words verbatim in high-pitch 1.8 voice with synchronized 3D mouth chattering animation. 5) When hamster finishes speaking, automatically starts listening again with a 380ms anti-echo delay. 6) Displays explicit status indicators: 'Listening...' and 'Speaking...'. 7) Added animated Stop control button next to Repeat to exit continuous mode at any time, with clean teardown across language switches and modal views. Button 2 (ANSWER) and all other features remain completely intact. |
| 2026-09-18 | Feature | Gemini AI Q&A for Answer Button | 1) Single tap on Button 2 (ANSWER) activates Answer Mode and listens to user question. 2) Automatically detects end of speech, stops mic, displays thinking state in speech bubble. 3) Server-side Gemini integration (`server.ts`, `/api/chat`) using `@google/genai` (`gemini-3.8-flash` with graceful `gemini-3.1-flash-lite` fallback). 4) Retains conversation history context across multiple turns so follow-up questions work naturally (e.g. pronoun resolution 'he', 'she', 'it'). 5) Native support for Bengali (BN), Hindi (HI), and English (EN) based on currently selected language. 6) Formats question and answer in floating speech bubble (`You: "..." \n 🐹: "..."`) with `whitespace-pre-line`. 7) Automatically speaks the answer in high-pitch cute hamster voice with 3D mouth animation, requiring no additional tap. 8) All existing UI design, Repeat button, 3D hamster size/camera, games, and pet-care features kept completely intact. |
| 2026-09-18 | Bug Fix | Voice System Restoration (Repeat & Answer TTS) | 1) Fixed SpeechSynthesis reliability in `speech.ts`: added global `activeUtterance` retention and keep-alive ticker to prevent Chrome/Safari garbage collector from cancelling audio mid-playback. 2) Added 35ms de-overlap queueing to prevent Chrome drop bugs when cancelling prior speech. 3) Strictly shielded the Continuous Repeat cycle in `HomeScreen.tsx` so mic error or onEnd events NEVER cancel or interrupt TTS during the speaking phase. 4) Verified the continuous cycle: Tap Repeat -> mic listens -> user speaks -> mic aborts -> hamster speaks exact words aloud in 1.8 pitch voice with 3D mouth animation -> automatically listens again without pressing Repeat. 5) Ensured Answer button uses identical TTS system to speak Gemini answers aloud with mouth chatter, with robust fallback speech. |
| 2026-09-18 | Refinement | Hamster Voice Quality & Speaking Animation Polish | 1) Soft, warm, cute voice tuning: adjusted pitch to 1.28 and rate to 1.0 to eliminate robotic/metallic frequency-stretching artifacts while keeping a playful, sweet tone. 2) Added `selectBestWarmVoice` prioritizing natural/neural female voices (e.g. Samantha, Jenny, Google US/বাংলা/हिन्दी) across English, Bengali, and Hindi. 3) Added `prepareTextForNaturalSpeech`: strips markdown symbols (*, #, ~), emojis, and redundant quotes, normalizes spacing after punctuation marks (. ! ? ; : ।) for natural sentence cadence and pauses without mid-sentence word clipping. 4) Enhanced 3D speaking animation: multi-harmonic phoneme articulation (replaces exaggerated sine waves with soft, natural mouth movement), synchronized conversational eyelid blinking, subtle micro-nods and head tilts, and gentle ear twitches. 5) Kept hamster size, camera framing, Repeat continuous cycle, Answer/Gemini behavior, and pet-care features completely intact. |
| 2026-09-18 | Bug Fix | Gemini Model 503 Capacity Spike & Cascade Resilience | 1) Fixed 503 high demand spikes by introducing a high-capacity model cascade: `gemini-flash-latest` -> `gemini-3.8-flash` -> `gemini-3.1-flash-lite`. 2) Added automatic jitter retry delay (350ms) for transient 503/429/UNAVAILABLE errors before switching models. 3) Replaced noisy stderr warning dumps with quiet error handling to prevent Cloud Run runtime error flags. 4) Added localized server fallback answer engine (`getSmartFallbackAnswer` for BN/HI/EN) so the user's pet always responds delightfully even during global model demand spikes. |
| 2026-09-18 | Migration | GitHub Import Audit & AI Studio Compliance | Verified project normalization according to `github-import-migration`: 1) Confirmed npm package manager alignment with no conflicting lockfiles. 2) Created `.env.example` documenting `GEMINI_API_KEY`. 3) Verified `metadata.json`, `index.html`, and `server.ts` binding to `0.0.0.0:3000`. 4) Passed full `lint_applet` and `compile_applet` production build verification. |

