# JARVIS Creator OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme the Bombay OS pitch demo into "JARVIS · by Northstar Studio", a creator-focused, voice-driven holographic AI OS with wake-up boot, Content Forge and hand gestures, keeping every existing screen and feature.

**Architecture:** Visual change is token-led (`tokens.css` + new `hud.css`). Creator content plugs into the existing `pick({...})` preset system. A new `src/jarvis/` module adds voice (ElevenLabs via a key-safe Vite proxy, browser STT), a hybrid brain (scripted intents → Gemini), narration, Forge and gestures; it drives the existing reducer through existing `Action`s plus a small number of new ones.

**Tech Stack:** React 19, TypeScript 7, Vite 8, framer-motion 13, Vitest, Web Speech API, ElevenLabs REST, Gemini `generateContent` REST, `@mediapipe/tasks-vision`.

**Spec:** `docs/superpowers/specs/2026-10-09-jarvis-creator-os-design.md`

## Global Constraints

- Branch: `jarvis-redesign`. Commit after every task.
- Product name `JARVIS`, maker `Northstar Studio`. "Northstar Studio" must not appear as a fictional client name anywhere.
- Presets: `creator` (default), `studio`, `realestate` (hidden from Setup UI). URL `?preset=agency` resolves to `studio`.
- API keys only in `.env`, read by the Vite plugin via `loadEnv` with no `VITE_` prefix. `.env` gitignored; `.env.example` committed.
- Env names: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL` (default `eleven_flash_v2_5`), `GEMINI_API_KEY`, `GEMINI_MODEL` (default `gemini-flash-latest`).
- Palette: cyan `#4fd8ff`, gold `#ffb547`, red `#ff4d4d`, background `#03070d` → `#0a1420`.
- Fonts: Orbitron (wordmark, large titles), Rajdhani (headings, labels), JetBrains Mono (numbers) via `@fontsource`.
- New keys: hold `V` push-to-talk, `F` Forge, `G` gestures, `W` replay wake-up. Existing keys unchanged; `C` (Control Room) works for `creator` and `studio`.
- Every external dependency degrades to a working fallback (spec §9). No thrown error may reach React render.
- Gemini persona: calm, dry wit, British, "sir"/"ma'am", ≤2 sentences, never claims to have posted or sent anything.
- 16:9 rem scaling and `MotionConfig reducedMotion="user"` preserved.

## Review Focus

1. **Speech while muted or mid-utterance:** a new `say()` while JARVIS is speaking cancels the previous line; with sound off (`S`) nothing is spoken but subtitles still show. Test in Task 6.
2. **Forge topic edge input:** empty, whitespace-only, 300-char or Arabic topics must still produce a valid package (trimmed, capped at 80 chars, fallback when empty). Test in Task 10.
3. **Gemini returns prose or fenced JSON instead of raw JSON for Forge:** parser strips ```json fences and falls back on any schema miss. Test in Task 10.
4. **Voice command while an overlay/run is busy:** intents that start a run while another run is `running` must behave exactly like the keyboard path (no double start). Test in Task 7.
5. **Time-lapse at 3×:** narration must not queue a backlog of lines; narration is skipped while `timelapse.active`. Test in Task 8.

---

### Task 1: Toolchain, Vitest and preset rename

**Files:**
- Modify: `package.json`, `src/data/prospect.ts`, every `pick({ agency, realestate })` site (`client.ts`, `deliverables.ts`, `integrations.ts`, `news.ts`, `signals.ts`, `workflows.ts`), `src/state/reducer.ts:84`, `src/state/AppProvider.tsx:150`, `src/state/selectors.ts:47`, `src/features/overlays/{CommandPalette,RoiScreen,ProspectSetup}.tsx`, `src/features/presenter/PresenterHUD.tsx`, `src/features/shell/TopBar.tsx`
- Create: `vitest.config.ts`, `src/data/prospect.test.ts`

**Interfaces:**
- Produces: `type PresetId = 'creator' | 'studio' | 'realestate'`; `resolvePreset(raw: string | null | undefined): PresetId`; `hasRoom(): boolean` (true for creator/studio); `usesUsd(): boolean` (true for creator/studio); `PRESETS` entries for `creator` and `studio` with `hidden?: boolean` (realestate hidden).

- [ ] **Step 1:** `npm install`, then `npm run build`. Expected: build passes. If Vite 8 rejects Node 20.17, stop and tell the user to install Node ≥ 20.19 (LTS 22).
- [ ] **Step 2:** `npm i -D vitest jsdom`, add `"test": "vitest run"`, `vitest.config.ts` with `environment: 'jsdom'`.
- [ ] **Step 3: Failing test** `prospect.test.ts`:
  ```ts
  expect(resolvePreset('agency')).toBe('studio');
  expect(resolvePreset('creator')).toBe('creator');
  expect(resolvePreset('realestate')).toBe('realestate');
  expect(resolvePreset(null)).toBe('creator');
  expect(resolvePreset('nonsense')).toBe('creator');
  ```
- [ ] **Step 4:** Implement. Rename `agency` keys to `studio` at every pick site; temporarily add `creator: <same const as studio>` so the build stays green (Task 4 replaces it). Replace every `preset === 'agency'` check with `hasRoom()` / `usesUsd()`. Studio default name `Falcon & Co Creative`; creator default name `Layla Noor`. Setup UI hides presets with `hidden`.
- [ ] **Step 5:** `npm test && npm run build`. Expected: PASS.
- [ ] **Step 6:** Commit `feat: creator/studio presets and vitest`.

### Task 2: Key-safe local API proxy and .env

**Files:**
- Create: `server/apiProxy.ts`, `server/apiProxy.test.ts`, `.env`, `.env.example`
- Modify: `vite.config.ts`, `.gitignore` (add `.env`, `.env.local`)

**Interfaces:**
- Produces (pure, testable): `ttsRequest(env: ProxyEnv, text: string): { url: string; init: RequestInit } | null`; `chatRequest(env: ProxyEnv, body: ChatBody): { url: string; init: RequestInit } | null`; `parseGeminiText(json: unknown): string`; `apiProxy(env: ProxyEnv): Plugin` registering `/api/tts`, `/api/chat`, `/api/health` in both `configureServer` and `configurePreviewServer`.
- `type ChatBody = { system: string; messages: { role: 'user' | 'model'; text: string }[]; json?: boolean }`. Response: `{ text: string }`. Health: `{ tts: boolean; chat: boolean }`.

- [ ] **Step 1: Failing tests:** `ttsRequest({}, 'hi')` → `null`; with key+voice → url `https://api.elevenlabs.io/v1/text-to-speech/<voice>/stream?output_format=mp3_44100_128`, header `xi-api-key`, body `model_id` `eleven_flash_v2_5`. `chatRequest` → url `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, header `x-goog-api-key`, body has `systemInstruction.parts[0].text`, and `generationConfig.responseMimeType === 'application/json'` only when `json: true`. `parseGeminiText` returns `candidates[0].content.parts[*].text` joined, `''` on malformed input.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement. Middleware rejects non-POST with 405, missing key with 503 `{ error: 'not-configured' }`, upstream failure with 502; text capped at 600 chars for TTS; 15s upstream timeout via `AbortSignal.timeout`. TTS pipes upstream body to the response with `content-type: audio/mpeg`.
- [ ] **Step 4:** `vite.config.ts` uses `loadEnv(mode, process.cwd(), '')` and adds `apiProxy(env)`. Write `.env.example` and `.env` with the five keys (values empty, model defaults filled in) and a comment on where to get each key.
- [ ] **Step 5:** `npm test`; `npm run dev`, `curl localhost:5173/api/health` → `{"tts":false,"chat":false}`. `git check-ignore .env` prints `.env`.
- [ ] **Step 6:** Commit (not `.env`) `feat: local proxy for ElevenLabs and Gemini`.

### Task 3: JARVIS visual system and branding

**Files:**
- Modify: `src/styles/tokens.css`, `src/main.tsx` (font imports), `src/data/client.ts` (`os`, `boot`), `src/components/primitives.tsx` (`BrandMark`), `src/features/shell/TopBar.tsx`, `src/sound/sound.ts`, existing stylesheets where they hard-code amber or serif
- Create: `src/styles/hud.css`

**Interfaces:**
- Produces CSS: tokens `--glow-1`, `--glow-2`, `--hud-line`, `--hud-fill`, `--f-hud` (Orbitron), `--f-head` (Rajdhani); utility classes `.hud-panel` (glass fill, hairline, corner brackets via `::before/::after`, scanline), `.hud-flicker` (mount animation, disabled under `prefers-reduced-motion`), `.hud-rings` (decorative rotating rings wrapper).
- `os = { name: 'JARVIS', maker: 'Northstar Studio', ... }`.

- [ ] **Step 1:** `npm i @fontsource/orbitron @fontsource/rajdhani`; import weights 500/700 in `main.tsx`; drop the Instrument Serif import.
- [ ] **Step 2:** Rewrite `tokens.css` with the Global Constraints palette, keeping every existing token name so all stylesheets re-skin. `--acc` = cyan, `--bad` = red, flag/warn uses gold, `--f-display` → Orbitron.
- [ ] **Step 3:** Add `hud.css`; apply `.hud-panel` to the main panel roots (signal rail, stage panels, ledger, output tray, room panels, overlays) and `.hud-rings` around the impact meter and ROI total. Restyle `OperationsMap` land and grid as cyan wire-frame with sweep and target-lock pings.
- [ ] **Step 4:** `grep -rn "f2a93b\|ffc877\|Instrument" src` returns nothing. Re-tune `sfx` to sci-fi tones (higher sine blips, a 0.8s power-up glide `sfx.powerUp()`, confirm chime); keep existing function names.
- [ ] **Step 5:** `npm run build` passes; open `npm run dev` in Chrome at 1440×810 and screenshot map, stage, Control Room, ROI. Check: no amber left, text contrast readable, corner brackets visible.
- [ ] **Step 6:** Commit `feat: JARVIS holographic theme`.

### Task 4: Creator and studio content

**Files:**
- Modify: `src/data/{client,signals,workflows,deliverables,integrations,news}.ts`, `src/components/IntegrationMark.tsx`
- Create: `src/data/integrity.test.ts`

**Interfaces:**
- Each data module additionally exports its raw by-preset record for tests: `workflowsByPreset`, `deliverablesByPreset`, `signalsByPreset`, `restrictedByPreset`.
- `IntegrationId` gains `'youtube' | 'instagram' | 'tiktok' | 'capcut'` with catalogue entries and marks.

- [ ] **Step 1: Failing integrity test** looping over `creator`, `studio`, `realestate`: each signal has a workflow with that `signalId`; every `wf.outputs` id and `primaryOutput` exists in deliverables; every check `flag.token` is a key of `wf.corrections`; every `{{token}}` used in that workflow's deliverables exists in `wf.corrections`; `wf.block.resourceId` exists in restricted resources; exactly 3 signals; no string contains `Northstar` except `os.maker`.
- [ ] **Step 2:** Run, expect FAIL (creator is still a studio copy, and studio contains Northstar).
- [ ] **Step 3:** Write `creator` content per spec §5.1: persona Layla Noor (`{client}`), Dubai lifestyle/tech, ~850k followers; team Omar (editor), Sara (manager), Dev (thumbnails). Signals `sig-deal` (brand deal; check flags `2.1M` → `1.4M` projected views, token `views`), `sig-viral` (reel at 4×; check flags missing sponsor disclosure, token `disclosure`), `sig-weekly` (Monday upload pack). Deliverables per signal: deal → counter-offer email, content plan, pitch deck; viral → follow-up brief, pinned comment, Shorts cross-post plan; weekly → calendar, EN/AR captions, team tasks. Currency USD. ROI copy: editing/admin/inbox hours, deal response time.
- [ ] **Step 4:** Rewrite `studio` copy from the creative director's seat; rename client to `{client}`; remove Northstar.
- [ ] **Step 5:** `npm test && npm run build`. Expected: PASS. Run each preset through one signal in Chrome.
- [ ] **Step 6:** Commit `feat: creator and studio content`.

### Task 5: Control Room for creators

**Files:**
- Modify: `src/features/room/seed.ts`, `src/features/room/i18n.ts`, `src/features/room/agent.ts` (place aliases/plan copy)

**Interfaces:**
- `seed.ts` chooses data by `prospect.preset === 'creator'`; exported names and types are unchanged.
- `i18n.ts`: `creatorOverrides: Partial<Record<Key, string>>` (EN + AR) applied in `translate` when preset is `creator`. Labels per spec §5.1 table.

- [ ] **Step 1:** Creator seed: channels are the creator's YouTube/Instagram/TikTok (owner `studio`) plus 3 niche peers; places = shoot location, brand HQs, event venues; stories = trend radar items (platform updates, trending audio); pipeline = brand deals; competitors = creators in the niche; tasks/routines = upload/edit/reply routines.
- [ ] **Step 2:** `npm run build`; open the Control Room under `creator` and `studio`, cycle all 8 panels with TV mode, toggle Arabic. Check: no agency wording in creator, no blank panels.
- [ ] **Step 3:** Commit `feat: creator Control Room`.

### Task 6: Voice I/O

**Files:**
- Create: `src/jarvis/voice/speak.ts`, `src/jarvis/voice/listen.ts`, `src/jarvis/voice/speak.test.ts`, `src/jarvis/voice/listen.test.ts`

**Interfaces:**
- `speak.ts`: `createSpeaker(opts?: { fetchImpl?: typeof fetch; synth?: SpeechSynthesis }): Speaker` with `Speaker = { say(text: string): Promise<void>; cancel(): void; level(): number; setMuted(m: boolean): void; onState(cb: (s: 'idle' | 'speaking') => void): () => void }`. `level()` returns 0–1 from an `AnalyserNode` (ElevenLabs path) or a synthetic 0.3–0.7 wobble (browser path).
- `listen.ts`: `createListener(opts?: { lang?: 'en-GB' | 'ar-AE' }): Listener` with `Listener = { supported: boolean; start(): void; stop(): void; level(): number; onTranscript(cb: (t: { text: string; final: boolean }) => void): () => void; onWake(cb: (rest: string) => void): () => void; setWakeMode(on: boolean): void }`. Wake fires on a final transcript starting with `jarvis` (case-insensitive, also `جارفس`), passing the remainder.

- [ ] **Step 1: Failing tests:** `say` with fetch rejecting → `synth.speak` called once with an utterance whose text matches; `say` while speaking → previous cancelled (`cancel` called) before next; muted → neither fetch nor synth called, promise resolves; listener with no `SpeechRecognition` on window → `supported === false` and `start()` is a no-op; wake detection: final `"Jarvis, show ROI"` → `onWake('show ROI')`, interim never fires wake.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement. ElevenLabs path: `POST /api/tts`, read to `Blob`, play through a shared `AudioContext` → `AnalyserNode` → destination. Browser voice choice: first of `en-GB` male-named voices (`Daniel`, `Arthur`, `Google UK English Male`), else any `en-GB`, else default; rate 1.0, pitch 0.9. Health check `/api/health` cached once per session to skip the fetch when `tts:false`. Listener auto-restarts on `onend` while active; mic level from a separate `getUserMedia` analyser, released on `stop()`.
- [ ] **Step 4:** `npm test` PASS.
- [ ] **Step 5:** Commit `feat: JARVIS voice in/out with fallbacks`.

### Task 7: Hybrid brain

**Files:**
- Create: `src/jarvis/brain/intents.ts`, `src/jarvis/brain/gemini.ts`, `src/jarvis/brain/snapshot.ts`, `src/jarvis/brain/persona.ts`, tests `intents.test.ts`, `gemini.test.ts`
- Modify: `src/state/types.ts` (new actions), `src/state/reducer.ts`

**Interfaces:**
- `type JarvisIntent = { kind: 'run'; signalIndex: 0 | 1 | 2 } | { kind: 'view'; view: 'map' | 'stage' | 'room' } | { kind: 'overlay'; overlay: 'roi' | 'setup' | 'palette' } | { kind: 'timelapse' } | { kind: 'autonomy'; level?: Autonomy } | { kind: 'integrations' } | { kind: 'advance' } | { kind: 'reset' } | { kind: 'briefing' } | { kind: 'forge'; topic: string } | { kind: 'gestures'; on: boolean } | { kind: 'wake' } | { kind: 'mute'; on: boolean }`.
- `matchIntent(text: string): JarvisIntent | null` (EN + AR; normalise with the same NFKD/diacritic stripping as `room/agent.ts`).
- `intentToActions(intent: JarvisIntent, state: AppState, now: number): Action[]` for every kind except `forge`, `gestures`, `wake`, `mute`, `briefing` (handled by the provider). `run` returns `RUN_SIGNAL`, which already guards against double start; `advance` reuses `presenterAdvance` logic via a new exported `advanceActions(state, now): Action[]`.
- `buildSnapshot(state: AppState): string` — compact JSON ≤ 2,000 chars: preset, client, current signal + stage + status, unhandled signals, impact, top 3 room stats.
- `JARVIS_PERSONA: string` (Global Constraints persona + "If asked to do something the demo cannot do, say what you can do instead").
- `askJarvis(question: string, snapshot: string, opts?: { fetchImpl?: typeof fetch; timeoutMs?: number }): Promise<{ text: string; source: 'gemini' | 'fallback' }>`; default timeout 8000.
- `FALLBACK_REPLY: string` = "I can run a brand deal, check what's trending, build a video package, or show you the numbers, sir. Which would you like?"

- [ ] **Step 1: Failing tests:** `matchIntent('run the brand deal')` → `{kind:'run',signalIndex:0}`; `'make me a video about the new iPhone in Dubai'` → `{kind:'forge',topic:'the new iPhone in Dubai'}`; `'show me the ROI'` → overlay roi; `'what's trending'` → `{kind:'view',view:'room'}`; `'wake up'` → wake; Arabic `'اعرض العائد'` → overlay roi; chit-chat `'how are you feeling today'` → `null`; `intentToActions(run, stateWithRunningSignal)` returns a single `RUN_SIGNAL` (reducer keeps the running run). `askJarvis` returns `fallback` on reject, on 503, on timeout (fake timers), and on empty text; returns `gemini` text on 200.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Implement. Signal phrases come from per-preset keyword lists in `intents.ts` (creator: deal/brand/offer, viral/reel/spike, weekly/upload/schedule; studio and realestate: words from their signal headlines).
- [ ] **Step 4:** `npm test` PASS. Commit `feat: hybrid JARVIS brain`.

### Task 8: JarvisProvider, arc-reactor, subtitles, narration

**Files:**
- Create: `src/jarvis/JarvisProvider.tsx`, `src/jarvis/narration.ts`, `src/jarvis/narration.test.ts`, `src/jarvis/ui/ArcReactor.tsx`, `src/jarvis/ui/Subtitles.tsx`, `src/jarvis/ui/jarvis.css`
- Modify: `src/App.tsx` (wrap in `JarvisProvider` inside `AppProvider`; mount `Subtitles`), `src/features/shell/TopBar.tsx` (mount `ArcReactor`), `src/state/AppProvider.tsx` (keys `V`, `G`, `W`, `F` forwarded through a `jarvisKeys` callback registry; `S` also mutes speech)

**Interfaces:**
- `useJarvis(): { mode: 'idle' | 'listening' | 'thinking' | 'speaking'; say(text: string): void; heard: string; spoken: string; levels(): { mic: number; out: number }; handle(text: string): Promise<void>; health: { tts: boolean; chat: boolean; stt: boolean }; gestures: boolean; setGestures(on: boolean): void; forge(topic: string): void }`. `forge` is a no-op stub until Task 10.
- `handle(text)`: `matchIntent` → dispatch `intentToActions` and speak a short confirmation from `narration.ts`; else `askJarvis(text, buildSnapshot(state))` → `say`.
- `narrationFor(prev: AppState, next: AppState): string | null` — returns at most one line per transition: stage changes (`understand`/`decide`/`execute`/`verify`/`deliver`), first `flag` check (uses `check.flag.reason`), block required, approval complete. Returns `null` when `next.timelapse.active` or same state.
- `ArcReactor` reads `mode` and `levels()` on `requestAnimationFrame`; SVG rings with CSS variables `--mic`, `--out`.
- `Subtitles`: shows `spoken` (cyan) and `heard` (dim), auto-fades after 4s; when `health.stt` is false, shows a text input that calls `handle`.

- [ ] **Step 1: Failing tests** for `narrationFor`: stage change to `verify` → string; check flag → string containing the flag reason; `timelapse.active` → `null`; identical state → `null`.
- [ ] **Step 2:** Run, expect FAIL; implement `narration.ts` with per-preset lines; PASS.
- [ ] **Step 3:** Implement provider, reactor, subtitles, keys (`V` keydown → `listener.start()`, keyup → `stop()`; ignored while typing in inputs).
- [ ] **Step 4:** `npm run build`; in Chrome with empty `.env`: hold `V`, say "show me the ROI" → ROI opens, browser voice confirms, reactor animates listening → speaking; type in fallback box when mic denied. Run signal 1 and hear stage narration; press `S` → silence.
- [ ] **Step 5:** Commit `feat: JARVIS provider, arc reactor and narration`.

### Task 9: Wake up, JARVIS

**Files:**
- Modify: `src/features/boot/BootSequence.tsx`, `src/data/client.ts` (`boot` copy), `src/App.tsx`, `src/styles/` boot rules
- Create: `src/jarvis/briefing.ts`, `src/jarvis/briefing.test.ts`

**Interfaces:**
- `morningBriefing(): string` built from the preset's `morning` and `signals` data (~3–5 sentences, starts "Good morning").
- Boot phases: `'dormant' | 'igniting' | 'assembling' | 'briefing'`. `dormant` waits for click, any key, or wake (listener in wake mode). `assembling` staggers shell regions in via a `bootPhase` context the shell regions read (`motion` variants: outline → fill), then dispatches `BOOT_DONE`. `briefing` speaks `morningBriefing()`; `Space` skips the speech. `W` key resets to `dormant`.

- [ ] **Step 1: Failing test:** `morningBriefing()` starts with "Good morning", mentions the first signal's subject, ≤ 600 chars.
- [ ] **Step 2:** Implement; `npm test` PASS.
- [ ] **Step 3:** In Chrome: fresh load → dormant; click → power-up sound, rings, panels assemble, spoken briefing with subtitles; reload and say "Wake up, JARVIS" after clicking once to grant the mic; `?setup` still skips boot.
- [ ] **Step 4:** Commit `feat: wake up JARVIS boot`.

### Task 10: Content Forge

**Files:**
- Create: `src/jarvis/brain/forge.ts`, `src/jarvis/brain/forgeSamples.ts`, `src/jarvis/brain/forge.test.ts`, `src/features/stage/ForgeStage.tsx`, `src/styles/forge.css`
- Modify: `src/state/compile.ts` (export `invalidate(workflowId: string)`), `src/data/workflows.ts`, `src/data/deliverables.ts`, `src/data/signals.ts` (registration helpers), `src/features/stage/OperatingStage.tsx` (render `ForgeStage` when `run.workflowId === 'wf-forge'`), `src/features/overlays/CommandPalette.tsx` (Forge intent), `src/jarvis/JarvisProvider.tsx` (`forge` implementation, `F` key topic prompt)

**Interfaces:**
- `type ForgePackage = { topic: string; angle: string; format: 'reel' | 'short' | 'youtube'; trend: { label: string; score: number }[]; hook: string; script: string[]; thumbnails: { title: string; visual: string }[]; shots: string[]; captions: { en: string; ar: string }; hashtags: string[]; postTime: string; issue: { field: string; generated: string; verified: string; reason: string } }` — exactly 3 thumbnails, 3–6 trend items, 4–8 script beats.
- `cleanTopic(raw: string): string` — trim, collapse whitespace, cap 80 chars, `''` if empty.
- `parseForge(text: string, topic: string): ForgePackage | null` — strips ``` fences, `JSON.parse`, validates shape and counts.
- `fallbackForge(topic: string): ForgePackage` — picks the sample from `forgeSamples.ts` (tech launch, food spot, travel) by keyword, substitutes `topic`; empty topic → tech sample with its own topic.
- `buildForgePackage(topic: string, opts?: { fetchImpl?: typeof fetch; timeoutMs?: number }): Promise<{ pkg: ForgePackage; source: 'gemini' | 'fallback' }>` — `POST /api/chat` with `json: true`, timeout 12000.
- `forgeToWorkflow(pkg: ForgePackage): { workflow: Workflow; deliverables: Deliverable[]; signal: Signal }` — ids `wf-forge` / `sig-forge`; 5 lanes (hook+script, thumbnails, shots, captions, hashtags+post time); one flagged check whose `token` is `forgeFix` and `corrections.forgeFix = { generated: issue.generated, verified: issue.verified }`; primary output `forge-package`.
- `registerForge(pkg: ForgePackage): void` — writes into `workflows`, `deliverables`, `signalById` (not into `signals[]`), then `invalidate('wf-forge')`.

- [ ] **Step 1: Failing tests:** `cleanTopic('   ')` → `''`; 300-char topic → length 80; `parseForge` accepts raw JSON and ```json fenced JSON, rejects 2 thumbnails / missing `issue` / prose; `fallbackForge('')` and `fallbackForge('شاورما في دبي')` return valid packages; `buildForgePackage` returns `fallback` on 503 and on timeout; `forgeToWorkflow(fallbackForge('x'))` passes the same integrity rules as Task 4 (outputs exist, token in corrections) and has 5 lanes.
- [ ] **Step 2:** Run, expect FAIL; implement; PASS.
- [ ] **Step 3:** Flow: `forge(topic)` → immediately `registerForge(fallbackForge(topic))` and `RUN_SIGNAL sig-forge` (so the run starts with zero wait); fire `buildForgePackage` in parallel; if Gemini returns before the run reaches `execute`, `registerForge(pkg)` again (same ids and lane count, so reducer state stays valid). JARVIS narrates.
- [ ] **Step 4:** `ForgeStage`: holographic panels positioned around a large central `ArcReactor`, each panel bound to its lane progress; thumbnails rendered as styled cards (gradient + title text); verify panel highlights `issue`. Deliverable opens in the existing viewer.
- [ ] **Step 5:** In Chrome: `F` → type "a video about the new iPhone in Dubai" → full run ≈60s at 1× with narration; repeat by voice; repeat with `.env` keys blanked → fallback package. `npm test && npm run build` PASS.
- [ ] **Step 6:** Commit `feat: Content Forge`.

### Task 11: Hand gestures

**Files:**
- Create: `src/jarvis/gesture/hands.ts`, `src/jarvis/gesture/classify.ts`, `src/jarvis/gesture/classify.test.ts`, `src/jarvis/ui/HandPreview.tsx`, `scripts/fetch-mediapipe.mjs`, `public/models/hand_landmarker.task`, `public/mediapipe/wasm/*`
- Modify: `package.json` (`"mediapipe": "node scripts/fetch-mediapipe.mjs"`), `src/jarvis/JarvisProvider.tsx`

**Interfaces:**
- `type Gesture = 'swipe-left' | 'swipe-right' | 'pinch' | 'fist'`.
- `classify(frames: { t: number; landmarks: { x: number; y: number }[] }[]): Gesture | null` — pure. Pinch: thumb tip (4) to index tip (8) distance < 0.05 of frame. Fist: all four fingertips (8, 12, 16, 20) below their PIP joints for ≥ 500 ms. Swipe: open palm, wrist (0) moves > 0.25 horizontally within 400 ms. Mirrored camera: x decreasing = `swipe-right`.
- `startHands(video: HTMLVideoElement, onGesture: (g: Gesture) => void): Promise<() => void>`; 800 ms cooldown after any gesture.
- Mapping in provider: swipe → `SELECT_SIGNAL` next/previous (or room panel next/prev when room open), pinch → `advanceActions`, fist → same as `Escape`.

- [ ] **Step 1:** `npm i @mediapipe/tasks-vision`; script copies `node_modules/@mediapipe/tasks-vision/wasm` to `public/mediapipe/wasm` and downloads `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task` to `public/models/`. Run it once and commit the files.
- [ ] **Step 2: Failing tests** for `classify` with synthetic landmark frames: pinch, fist held 600 ms, fist held 200 ms → `null`, swipe right and left, slow drift → `null`.
- [ ] **Step 3:** Implement; PASS.
- [ ] **Step 4:** `G` toggles; camera denied → toast "Gestures unavailable", stays off. In Chrome: swipe changes signal, pinch advances, fist closes ROI. `HandPreview` shows a cyan skeleton bottom-left.
- [ ] **Step 5:** Commit `feat: hand gesture control`.

### Task 12: Presenter polish, README and final verification

**Files:**
- Modify: `src/features/presenter/PresenterHUD.tsx` (new keys + health row: TTS ElevenLabs/Browser, Brain Gemini/Scripted, STT on/off), `src/features/overlays/CommandPalette.tsx` (voice/Forge/gesture/wake entries), `README.md`

- [ ] **Step 1:** HUD and palette updates; `npm run build`.
- [ ] **Step 2:** README: new name, three presets, `.env` setup with links (ElevenLabs API keys + Voice Library; Google AI Studio API key), Chrome requirement, new pitch flow (wake → signal 1 → voice question → Forge → Control Room → ROI), key table additions, fallback behaviour.
- [ ] **Step 3:** Full walkthrough in Chrome for `creator`, `studio`, `realestate`: boot, 3 signals through all stages including access-required and verify flag, Forge, time-lapse `T`, ROI `O`, Setup `P`, palette, integrations `I`, autonomy `A`, Control Room `C` + TV + Arabic, gestures, mute; once with keys present (if the user has filled `.env`) and once without. `npm test && npm run build` PASS.
- [ ] **Step 4:** Commit `docs: JARVIS README and presenter HUD`.
