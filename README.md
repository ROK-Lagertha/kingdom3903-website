# 3903 | The Citadel

Version 2.3.0 — First live tool card: ROK BattleTrack.

## Included
- `index.html` — responsive Citadel homepage with the existing official logo and one BattleTrack card.
- `assets/citadel-logo.png` — existing royal crest with handwritten tagline, unchanged.
- `assets/battletrack-card.png` — gold-framed royal navy BattleTrack card background.

The card includes a live link to https://battletrack.kingdom3903.com/.

## Deployment
Upload the complete package contents to the root of the `ROK-Lagertha/kingdom3903-website` GitHub repository, preserving the `assets/` directory. Keep any existing Cloudflare configuration files in the repository. The connected Cloudflare deployment should then publish the new homepage.

This package changes **only the main website**. The BattleTrack and FlagFiller Workers are not modified.

## Responsive design
The logo scales to its container without cropping. The BattleTrack card uses a desktop horizontal layout and switches to a bottom-aligned text treatment on narrow mobile screens, keeping the title, description and button legible.
