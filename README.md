# 3903 | The Citadel — v2.4.0

Minimal homepage with official Citadel logo and a more compact ROK BattleTrack card featuring a royal capybara knight.

## Deployment

Upload the contents of this ZIP to the root of the `ROK-Lagertha/kingdom3903-website` GitHub repository, replacing the previous `index.html` and `assets` contents. Preserve any Cloudflare configuration files already in the repository. Cloudflare's connected deployment should then publish the updated homepage at https://kingdom3903.com.

## Features

- Desktop: compact 850px-wide illustrated BattleTrack card, linking to the live app.
- Mobile: cropped knight illustration with separately readable HTML title, description and action text.
- Responsive logo and accessible keyboard-focus styling.
- No changes to BattleTrack or FlagFiller applications.

Note: The desktop card illustration contains decorative lettering as part of the artwork; the link has an accessible text label, and the mobile card uses HTML text for readability.


## Version 2.4.1 — Frame refinement
- Removed the extra CSS border, corner radius, card background and shadow.
- Retained the original decorative gold border and glow embedded in the BattleTrack artwork.
- On mobile the entire artwork is shown without cropping its ornate frame.
- The whole card remains a responsive link to BattleTrack.
