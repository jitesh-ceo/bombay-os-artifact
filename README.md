# Bombay OS — AI Operating Layer (pitch artifact)

Frontend-only interactive demo for Bombay Media. It shows an AI operating layer taking a live business signal through **Understand → Decide → Execute → Verify → Deliver**.

Default scenario: a **digital marketing & technology agency** (Northstar Studio). A real-estate developer preset is still available. No backend, no OAuth, no external APIs.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

Present in full-screen Chrome. The 16:9 stage scales to any viewport; 1440×810, 1280×720 and 1920×1080 all fill exactly.

Personalise before a meeting:

```
http://localhost:5173/?client=Acme&preset=agency
http://localhost:5173/?setup
```

`preset` is `agency` (default) or `realestate`. The top-bar **Setup** chip does the same in 10 seconds.

## Recommended pitch flow

1. Boot, then the **live operations map** of the UAE. Radar sweep from Dubai HQ. Three pings: Abu Dhabi brief, Sharjah performance alert, Dubai Monday reports.
2. Click the Abu Dhabi ping or press `1`, then **Run**. Watch Understand → Decide → Execute.
3. **Access required** on the finance folder. Press Space to request access.
4. **Verify** flags an unsupported 4.2× ROAS claim against the Glow & Co case study and corrects it to 3.1×.
5. Open the proposal, **Approve & send**. Impact meter updates.
6. Optional: `A` to show Suggest / Autopilot, `T` for the morning time-lapse, `O` for the ROI close.

## Presenter controls

| Key | Action |
| --- | --- |
| `Space` / `→` | Advance whatever is next |
| `M` | Toggle map / stage |
| `A` | Cycle autonomy (Suggest → Draft → Approve → Autopilot) |
| `T` | Morning time-lapse (all 3 signals at 3×, then a summary card) |
| `O` | Closing ROI screen |
| `P` | Prospect setup |
| `⌘K` / `Ctrl+K` | Command palette (not a chatbot) |
| `S` | Sound on / off |
| `I` | Integrations |
| `H` | Presenter HUD |
| `1` `2` `3` | Select a signal |
| `R` | Reset |
| `Esc` | Close overlays |

## What the extras do

- **Autonomy dial** (left rail): Suggest waits for plan approval; Draft approves each deliverable; Approve is one-click send; Autopilot delivers verified work with no approval step.
- **Without Bombay OS**: a thin manual timeline under the stage track. When Bombay OS finishes, the person is still on step 2.
- **Morning time-lapse** (`T` or the AM chip): runs all three signals on Autopilot at 3× and ends on “Before 9:00 AM”.
- **ROI screen** (`O`): monthly hours, cost equivalent, response-time change, team-size slider, Bombay Media CTA.
- **Command palette**: four intents plus map / time-lapse / ROI / setup. “What needs my attention?” composes a briefing.
- **Sound**: a tick when facts arrive, a low tone on a flag, a chime on delivery. Off by default; persisted in localStorage.

## Re-skinning

All prospect-specific copy lives in `src/data/`:

- `prospect.ts` — URL / localStorage name and preset
- `client.ts` — identity, ambient ledger, ROI assumptions
- `signals.ts` — signals, map accounts, command intents, morning card
- `workflows.ts` — facts, plan, lanes, checks, manual race steps
- `deliverables.ts` — document bodies (`{{roas}}` / `{{price}}` swap after verification)
- `integrations.ts` — catalogue and restricted folders

`{client}`, `{initials}` and `{domain}` in those files are replaced with the prospect name.

## Structure

```
src/
  data/        mock business data (edit these to re-skin)
  state/       reducer, workflow compiler, autonomy, presenter keys
  features/    boot, map, stage, outputs, overlays, integrations
  sound/       WebAudio cues (no audio files)
  styles/      tokens, base, shell, stage, overlays, map, extras
```
