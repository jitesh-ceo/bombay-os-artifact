# JARVIS · by Northstar Studio

An interactive pitch demo of an AI operating system for content creators, styled after Iron Man's JARVIS. It takes a live signal (a brand deal, a viral reel, the weekly upload pack) through **Understand → Decide → Execute → Verify → Deliver**. You can talk to it, it talks back, and it can build a full video package from one sentence.

It runs on your laptop. The demo data is made up. Voice and AI answers are optional: without API keys everything still works, using the browser's voice and scripted answers.

## Setup

You need **Node.js 22 or newer** and **Chrome** (or Edge). Voice input only works reliably in Chrome and Edge.

```bash
npm install          # also copies the hand-tracking runtime into public/
npm run dev          # http://localhost:5173
```

### API keys (optional, recommended)

Copy `.env.example` to `.env` (on this machine `.env` already exists with empty values) and fill it in:

| Key | Where to get it | What it adds |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | [elevenlabs.io → Settings → API keys](https://elevenlabs.io/app/settings/api-keys) | JARVIS's real voice |
| `ELEVENLABS_VOICE_ID` | [ElevenLabs Voice Library](https://elevenlabs.io/app/voice-library). A calm British male voice suits JARVIS | Which voice |
| `GEMINI_API_KEY` | [Google AI Studio → API key](https://aistudio.google.com/apikey) | Answers to any question, and Content Forge packages written for your topic |

`ELEVENLABS_MODEL` and `GEMINI_MODEL` have sensible defaults. Restart `npm run dev` after editing `.env`.

The keys stay on your machine. The browser never sees them: the dev server calls ElevenLabs and Gemini for it, through `/api/tts` and `/api/chat`. `.env` is git-ignored, so never commit it.

To check what is live, press `H`. The **JARVIS** row shows `Voice · ElevenLabs/Browser`, `Brain · Gemini/Scripted` and `Ears · Mic/Typed`.

## Presets

| URL | Who it is for |
| --- | --- |
| `?preset=creator` (default) | A solo creator with a small team: brand deal, viral reel, weekly upload pack |
| `?preset=studio` | A creator-led content studio: client brief, campaign performance, client reports |
| `?preset=realestate` | Kept from the earlier demo; not shown in Setup |

Add `&client=Name` to put the prospect's name on every screen, for example `?client=Noura&preset=creator`. `?setup` or the **Setup** chip does the same in ten seconds. Old `?preset=agency` links open the studio preset.

## Pitch flow

1. **Wake-up.** The reactor is dormant. Click once to arm it (browsers only allow sound after a click), then say **“Wake up, JARVIS”**, or press `Space`. It ignites, links the tools, the HUD assembles, and JARVIS gives a spoken morning briefing. `Space` skips the briefing.
2. **Control Room.** Creator view: live channel stats, upload queue, trend radar, brand-deal pipeline, creators in your niche. `C` switches between the room and the execution view.
3. **A signal.** Say **“Jarvis, run the brand deal”**, or press `1` then `Space`. JARVIS narrates each stage. On **Access required**, press `Space` to request it. On **Verify**, it catches the brand's inflated 2.1M view estimate and corrects it to 1.4M. Open the pitch deck and **Approve & send**.
4. **Ask anything.** Hold `V` and ask, for example, “How did the viral reel do?” Scripted commands answer at once. Anything else goes to Gemini, or to a short list of what JARVIS can do if there is no key.
5. **Content Forge.** Say **“Jarvis, make me a video about the new iPhone in Dubai”**, or press `F` and type a topic. JARVIS builds the angle, hook, script, three thumbnail concepts, shot list, English and Arabic captions, hashtags and a posting time in about 60 seconds. It flags one problem (a missing disclosure, an unverifiable claim or a permit) and fixes it before delivery. Let the prospect pick the topic.
6. **Hand gestures (optional).** Press `G`. Pinch to advance, hold a fist to close, swipe to switch signals. A small preview shows the tracked hand. If there is no camera, JARVIS says so and gestures stay off.
7. **Close.** `T` plays the morning time-lapse; `O` opens the ROI screen.

## Talking to JARVIS

- **Wake word:** start any sentence with “Jarvis”, for example “Jarvis, show me the ROI”. Say “Jarvis” alone and it answers “Yes?”, then listens for six seconds.
- **Push to talk:** hold `V`, speak, release.
- **Type:** click the arc reactor in the top bar. If the microphone is blocked or the browser has no speech recognition, a typed box appears instead.
- English and Arabic both work: “اعرض العائد” opens the ROI screen.
- `S` mutes JARVIS and the sound effects together.

Commands it knows without AI: run a signal by name or number, the Control Room, map, stage, ROI, setup, time-lapse, integrations, autonomy (“autopilot”, “suggest mode”), next / continue / approve, reset, “what needs my attention”, gestures on/off, mute/unmute, wake up, and “make me a video about…”.

## Keys

| Key | Action |
| --- | --- |
| `V` (hold) | Talk to JARVIS |
| `F` | Content Forge |
| `G` | Hand gestures on / off |
| `W` | Replay the wake-up |
| `Space` / `→` | Advance whatever is next |
| `C` | Control Room / execution |
| `M` | Map / stage |
| `A` | Cycle autonomy (Suggest → Draft → Approve → Autopilot) |
| `T` | Morning time-lapse |
| `O` | ROI screen |
| `P` | Prospect setup |
| `⌘K` / `Ctrl+K` | Command palette |
| `S` | Sound and voice on / off |
| `I` | Integrations |
| `H` | Presenter HUD |
| `1` `2` `3` | Select a signal |
| `R` | Reset |
| `Esc` | Close |

## When something is missing

| Missing | What happens |
| --- | --- |
| ElevenLabs key or internet | JARVIS speaks with the browser's best British voice |
| Gemini key, slow answer or bad output | Scripted answers; Content Forge uses a matching pre-written package |
| Speech recognition (non-Chrome browser) | Typed command box |
| Microphone blocked | Typed command box; keys and clicks work as normal |
| Camera blocked | Gestures stay off and JARVIS says so |
| Hosted as static files (no dev server) | Everything above falls back together |

## Development

```bash
npm test             # unit tests (Vitest)
npm run build        # type-check app and server, then build
npm run preview      # serve the build, with the same /api proxy
npm run mediapipe    # re-copy the hand-tracking runtime if public/mediapipe is missing
```

```
server/        local proxy for ElevenLabs and Gemini (keys from .env)
src/data/      demo business data per preset; creator content in src/data/creator/
src/jarvis/    voice (listen/speak), brain (intents, Gemini, Forge), narration, gestures, UI
src/state/     reducer, workflow compiler, autonomy, presenter "advance"
src/features/  boot, map, stage (incl. Forge stage), outputs, overlays, Control Room
src/styles/    tokens (JARVIS palette), HUD layer, Forge
```

To re-skin for another prospect, edit `src/data/` (and `src/data/creator/`) and the Control Room seed in `src/features/room/seed.*.ts`. `{client}`, `{initials}` and `{domain}` are replaced with the prospect's name.
