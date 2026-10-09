# JARVIS · by Northstar Studio — Creator OS redesign

Date: 2026-10-09
Status: Approved in conversation, pending written-spec review

## 1. Goal

The client rejected the current Bombay OS demo. Re-frame the same product for **content creators** and give it the look, sound and behaviour of Iron Man's JARVIS, without changing the core idea or removing anything currently on screen.

Success means, in a live meeting:

- Every existing screen and feature is still present (stage flow, Control Room panels, map, ROI, command palette, morning time-lapse, autonomy dial, manual race, integrations, presenter HUD, prospect setup, all keyboard shortcuts).
- The interface reads unmistakably as a JARVIS holographic HUD.
- The presenter can talk to JARVIS and JARVIS talks back in a JARVIS-like voice.
- Three "wow" moments land: the wake-up boot, Content Forge, and hand-gesture control.
- No failure of a key, network, browser API or camera can break the demo; each degrades to a working fallback.

## 2. Constraints

- Frontend pitch artifact, React 19 + TypeScript + Vite + framer-motion. No hosted backend.
- Presented locally in full-screen Chrome via `npm run dev` or `npm run preview`.
- API keys never reach the browser bundle.
- 16:9 rem-scaled stage (1440×810 canvas) is kept.
- Re-skinning remains data-driven via `src/data/` and the Control Room seed.

## 3. Branding

- Product name: **JARVIS**, maker: **Northstar Studio** (`os.name = 'JARVIS'`, `os.maker = 'Northstar Studio'`).
- "Northstar Studio" is removed as a fictional *client* name everywhere; prospect names continue to come from `{client}` (URL `?client=` / Setup).
- The presenter fields in `src/data/client.ts` stay editable data.

## 4. Visual system (JARVIS skin)

- `src/styles/tokens.css` is rewritten to a holographic palette; all existing CSS consumes these tokens, so every panel re-skins together.
  - Background: deep navy-black (`#03070d` → `#0a1420` steps).
  - Primary accent: arc-reactor cyan `#4fd8ff` with glow tokens (`--glow-1`, `--glow-2`).
  - Warning / flag accents: Stark gold `#ffb547` and red `#ff4d4d`. `--ok` becomes a cyan-green.
  - Text: near-white with cool greys.
  - Fonts: Orbitron for the JARVIS wordmark and large titles, Rajdhani for UI headings and labels, both via `@fontsource`; mono stays JetBrains Mono. Instrument Serif and amber are retired.
- HUD treatment (new `src/styles/hud.css`, plus targeted edits in existing stylesheets):
  - Panels: glass fill, 1px cyan hairline, angled corner brackets, faint scanline overlay, short flicker-in on mount.
  - Decorative rotating rings / tick dials around key figures (impact meter, ROI totals).
  - Operations map rendered as a cyan wire-frame grid with sweep and target-lock pings.
- **Arc-reactor core** (`src/jarvis/ui/ArcReactor.tsx`): persistent animated orb in the top bar with four states, driven by `JarvisProvider`:
  - `idle` slow breathing; `listening` rings scale with mic level; `thinking` spin; `speaking` pulse with TTS output level.
- **Subtitle strip** (`src/jarvis/ui/Subtitles.tsx`): what JARVIS says and what it heard, bottom-centre.
- Sound cues in `src/sound/sound.ts` re-tuned to sci-fi tones (blip, power-up hum, confirm chime); still synthesised with WebAudio.
- Copy re-voiced as JARVIS ("Good morning. Three items require your attention.").
- `prefers-reduced-motion` keeps working through the existing `MotionConfig`.

## 5. Creator story (data and presets)

`src/data/prospect.ts` presets become `creator` (default), `studio`, `realestate` (kept, hidden from Setup UI). Every `pick({...})` in `src/data/` and the Control Room seed gains `creator` and `studio` entries; `agency` content is migrated into `studio`. The `?preset=agency` URL value maps to `studio` for backward compatibility.

### 5.1 `creator` — solo creator + small team

Persona: Dubai-based lifestyle/tech creator, ~850k followers across YouTube, Instagram, TikTok. Team: editor, manager, thumbnail designer.

Signals (each a full 5-stage workflow with facts, plan, lanes, checks, manual-race steps and deliverables):

1. **Brand deal** — skincare brand offer by email. Understand past rates and audience fit; produce counter-offer email and content plan. Verify corrects the brand's 2.1M projected views to the real 90-day average 1.4M in the pitch deck.
2. **Viral spike** — yesterday's reel at 4× normal velocity. Produce follow-up video brief, pinned comment, Shorts cross-post. Verify flags a missing sponsor disclosure and adds it.
3. **Weekly upload pack** — scheduled Monday run: weekly calendar, EN + AR captions, team task list.

Control Room panel relabels (same panel components and ids):

| Panel id | New label |
|---|---|
| `wall` | Live channel stats |
| `buffer` | Upload queue |
| `pipeline` | Brand-deal pipeline |
| `rivals` | Creators in your niche |
| `news` | Trend radar |
| `today`, `cmd` | Today / Commands (creator tasks) |
| `radar` | Radar (shoot locations, brand HQs, events) |

Integrations catalogue gains creator tools shown as marks (YouTube Studio, Instagram, TikTok, CapCut / Premiere, Gmail, Drive, Notion). ROI screen: weekly hours of editing/admin/inbox saved, deal response time, team-size slider.

### 5.2 `studio` — creator-led media studio / agency

Current agency content re-told from the creative director's seat: client campaigns, shoot calendar, multi-creator roster. Same three-signal structure.

### 5.3 `realestate`

Unchanged content, re-skinned automatically. Not offered in the Setup UI; still reachable by `?preset=realestate`.

## 6. Voice and brain

New folder `src/jarvis/`:

| Unit | Responsibility | Fallback |
|---|---|---|
| `voice/listen.ts` | Web Speech `SpeechRecognition` (en-US / en-GB / ar-AE). Push-to-talk (hold `V`) and wake phrase "JARVIS". Emits interim/final transcripts and mic level. | Unsupported → typed input field in the subtitle strip. |
| `voice/speak.ts` | `speak(text)` → POST `/api/tts`, stream audio via `MediaSource`/blob into an `AudioContext` analyser to expose output level. Queue + cancel. Respects existing sound mute (`S`). | Fetch error / no key → `speechSynthesis` with best British male voice. |
| `brain/intents.ts` | Pure function `matchIntent(text, ctx) → Intent | null`. Intents map to existing reducer actions (run signal 1/2/3, show map, time-lapse, ROI, setup, autonomy, integrations, Control Room, reset) and new ones (forge topic, wake, gestures on/off, briefing). | Always available. |
| `brain/gemini.ts` | `askJarvis(question, snapshot)` → POST `/api/chat`. System prompt: JARVIS persona (calm, dry wit, British, addresses user as "sir"/"ma'am", ≤2 sentences, never claims to have posted/sent anything). Snapshot = compact JSON of signals, Control Room stats, deals, current stage. 8s timeout. | Error/timeout/no key → scripted "I can do X, Y or Z" reply. |
| `brain/forge.ts` | `buildForgePackage(topic)` → Gemini JSON (hook, script beats, 3 thumbnail concepts, shot list, EN/AR captions, hashtags, angle/format, best post time, one verify issue + fix). Validated and normalised. | Invalid/failed → nearest of 3 pre-written sample packages, topic substituted into titles. |
| `JarvisProvider.tsx` | State machine `idle → listening → thinking → speaking`, routes transcript → intents → Gemini, exposes `say()`, mic/output levels, subtitles. | — |

Narration: `src/jarvis/narration.ts` maps workflow stage transitions and verify flags to short spoken lines per preset; the provider subscribes to app state and speaks them. Narration is skipped while muted or in the time-lapse at 3×.

### 6.1 Key-safe local proxy

A Vite plugin in `vite.config.ts` (`configureServer` + `configurePreviewServer`) adds:

- `POST /api/tts` `{ text }` → ElevenLabs `text-to-speech/{ELEVENLABS_VOICE_ID}/stream` (model `eleven_flash_v2_5`), pipes `audio/mpeg` back.
- `POST /api/chat` `{ system, messages, json? }` → Gemini `generateContent` (model from `GEMINI_MODEL`, default `gemini-flash-latest`), returns `{ text }`.
- `GET /api/health` → `{ tts: boolean, chat: boolean }` so the UI knows which fallbacks are active (shown in the presenter HUD).

Keys read with Vite `loadEnv` from `.env` (no `VITE_` prefix, so never bundled). `.env.example` committed; `.env` added to `.gitignore`. On a plain static host the endpoints 404 and fallbacks engage.

## 7. Wow features

### 7.1 Wake up, JARVIS (replaces `BootSequence`)

1. Black screen, dim reactor, prompt "Say 'Wake up, JARVIS' — or click". First click/keypress also unlocks audio.
2. On wake: reactor ignites, power-up cue, rings spin out; panels assemble in sequence (outline draw → glass fill → data count-up) using framer-motion staggered variants on the existing shell regions.
3. Spoken morning briefing (~20s) composed from the preset's `morning` data, with subtitles. `Space` skips. Clicking without mic still runs the full sequence.

### 7.2 Content Forge

- Triggers: voice "make me a video about …", command palette intent, `F` key (opens topic input).
- Runs as a dynamic workflow through the existing stage engine: `src/state/compile.ts` accepts a Forge package and produces the same compiled workflow shape (facts, plan, lanes, checks, deliverables) so `OperatingStage`, `StageTrack`, panels, output tray and viewer render it unchanged.
- New layout variant `ForgeStage` (holographic panels orbiting the reactor) used when the active workflow is a Forge run.
- Stages: Understand (trend check, trend bars), Decide (angle + format), Execute (hook, script, 3 thumbnail concept cards, shot list, EN/AR captions, hashtags in parallel lanes), Verify (one flagged issue corrected — disclosure or unverified claim), Deliver (package in output tray + best post time).
- JARVIS narrates each stage. Target ≈60s at 1×.
- Gemini request fires at Understand; the Understand/Decide animations cover latency. If no result by Execute, the fallback package is used.

### 7.3 Hand gestures

- `src/jarvis/gesture/hands.ts` using `@mediapipe/tasks-vision` HandLandmarker, model file served from `public/models/hand_landmarker.task`, WASM from the package's local assets.
- Toggled by `G` or voice; off by default. Shows a small cyan hand skeleton preview in a corner while active.
- Gestures → existing actions: open-palm horizontal swipe = next/previous panel or signal; pinch = select / approve / advance (same as `Space`); closed fist held 0.5s = close overlay (`Esc`). Debounced with cooldowns.
- Camera denied / unsupported → toast "Gestures unavailable", feature stays off.

## 8. Keyboard additions

| Key | Action |
|---|---|
| `V` (hold) | Push-to-talk |
| `F` | Content Forge |
| `G` | Toggle hand gestures |
| `W` | Replay wake-up sequence |

All existing keys keep their behaviour. Presenter HUD lists the new keys and fallback status.

## 9. Error handling summary

| Failure | Behaviour |
|---|---|
| No ElevenLabs key / network | Browser TTS voice |
| No Gemini key / timeout / bad JSON | Scripted reply; Forge uses sample package |
| No SpeechRecognition | Typed input in subtitle strip |
| Mic denied | Toast; click/keyboard paths still work |
| Camera denied / MediaPipe load fail | Gestures stay off, toast |
| Static hosting (no proxy) | `/api/health` fails → all fallbacks |

## 10. Testing

- `npm run build` (tsc + vite) must pass.
- Add Vitest with unit tests for: `matchIntent` (each intent, EN + AR phrasing, no false positives on chit-chat), Gemini/TTS client fallbacks (mocked fetch failures and timeouts), `buildForgePackage` validation/normalisation, and Forge package → compiled workflow shape.
- Manual browser walkthrough in Chrome for each preset: wake-up, three signals through all stages, Forge with a live topic and with keys removed, Control Room, ROI, time-lapse, setup, gestures on/off, mute.
- README updated: new pitch flow, keys, `.env` setup, new shortcuts, Chrome requirement.

## 11. Out of scope

Real posting or scheduling to social platforms, real thumbnail image generation, hosted backend or auth, mobile layout.
