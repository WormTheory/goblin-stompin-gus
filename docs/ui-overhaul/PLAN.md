# UI overhaul: build plan (approved by Thomas, 2026-11-10)

Mockups in this folder: Main (title screen), CharSelect, Pause, HUD, Kit (style kit). Each .html opens on its own and shows the exact CSS used; the .png files are screenshots. Match them closely.

## The look
- Flat crayon colours, thick ink outlines (#2B1B2E) with uneven "hand-drawn" corners (irregular border-radius), hard ink drop shadows (no blur), a faint 2-px checker dither texture on panels.
- Palette: ink #2B1B2E, paper #FFF6DC, Gus green #7FD14A, Gertie pink #F29A8C, yolk #FFD447 (focus, score), tomato #FF6B5E (damage, combo), sky #8EC8F2 (online, info), biscuit #F6C66B (settings).
- Fonts: **Jersey 10** (Google Fonts, weight 400) for titles, buttons, numbers and shouts, with a stepped ink text outline. **Atkinson Hyperlegible Next** stays for anything you read (descriptions, options, patch notes).
- Focused button bobs and tilts with a dashed yolk ring, visible from the couch.
- Small CSS pixel sprites (box-shadow pixel art) for character portraits and hearts. Kit.html has the sprite CSS.
- Text keeps at least 4.5:1 contrast. A reduced-motion setting turns off the wobble, bob and pops.

## Phases (build all six, commit each separately on `test`, no reviews between)
1. **Foundation.** Add Jersey 10 to the existing Google Fonts link in src/page.html. Replace the :root colour tokens in src/style.css with the palette. Shared classes: wobbly panel, chunky button with focus bob, sticker, text outline, dither, prompt glyphs (restyle `.prompts`). No layout changes; everything still works.
2. **Title screen and character select.**
   - A real title screen: logo top left (GOBLIN-STOMPIN' / big wiggling GUS), menu card on the right: PLAY first, then CO-OP, PLAY ONLINE, NEW CITY + OPTIONS, and a small "Workshop" line with Testing Environment, Dev and Full screen. A "What's new" sticker (the existing patch-notes-latest build slot). Hostility moves to Options.
   - **Background (Thomas's call):** a side view of Gus's real 3D model stomping along, walking in place, in front of a stylised, scrolling backdrop of the game's cities (blocky buildings in the game's colours and style, parallax layers, sky). It's its own small three.js scene, not the live city. It scrolls as Gus stomps, and stops rendering once you're in the game.
   - Character tab restyled as the four sticker cards (Gus, Gertie, Gnash, Grizzle) with 1P/2P tags and a move-list strip. Keep the swap rule and the split-screen behaviour that just landed.
3. **Pause menu and the other tabs.** Replace the tab bar with a column of big buttons (RESUME, MAP, OBITUARY with count, CHARACTER, CONTROLS, OPTIONS, QUIT TO TITLE) beside a "This rampage" stats card. Map, Obituary, Character, Controls, Options and Patch notes open inside the same card; LB/RB (and keyboard equivalents) jump between them. Dev becomes a small tag in the corner. Player two's menu keeps leaving out Options, Dev, Testing Environment and the city controls, and carries a pink 2P tag (1P green). Reskin Options, Controls, Obituary, Patch notes and the online panel. Dev tab: new colours only.
4. **HUD reskin.** Score top left in Jersey 10; hearts as pixel sprites in a paper panel with the stamina bar bottom centre; stomp meter as a shout (FULL CHARGE!); day panel + clock disc top right; minimap as a round plate; place banner as a sticker; chat, voice chips, speedometer and debug pad restyled. Check both split-screen layouts (left/right and top/bottom).
5. **Game feel.**
   - Combo counter: each kill or smash within ~3 s of the last adds 1 and refills a draining bar. **It multiplies score** (decide a sensible curve, e.g. +10% per step capped at x3, and say what you chose in the patch notes). **Named milestones** (write fun ones, e.g. x5 Stompin'!, x10 STOMPTACULAR!, x20 ...). Per player in split-screen and online.
   - Score pop-ups: +points float up from where they were earned (pooled DOM, world-to-screen, cap ~20).
   - Damage numbers and shouts (SPLAT! on a flattened goblin): **on by default**, toggle in Options.
   - Wreck feed: the existing flashLabel toasts become stickers stacking top right, newest first, fading.
   - City wrecked bar bottom right: destroyed % of the place you're in (setDestroyed already works it out).
   - Rampage stats for the pause card: goblins flattened, score, best combo, cars tossed; reset with a new city.
   - Online: each player's pops/combo/feed come from their own hits; the host sends score events like other effects.
6. **Polish.** Timing, sound hooks for pops and combo milestones (existing audio.js), reduced-motion option, performance pass with a full crowd, screenshot review at 1280x720, 1920x1080 and split-screen.

## Rules
- Follow CLAUDE.md: edit src/ only, rebuild with `python tools/build.py`, commit game/index.html (and game/patch-notes/index.html) with each change, run the tests (tools/run_tests.sh plus the UI suites in tools/ui: uist.js, padnav.js) before each commit.
- Work on `test`. Commit each phase. **Never push.**
- Gus and Gertie must stay mechanically identical: any change to one's abilities applies to both.
- Patch notes: player-facing notes under the existing "## Version 0.3" in src/patch-notes.md (unreleased).
- One file, no new dependencies, works when simply opened.
