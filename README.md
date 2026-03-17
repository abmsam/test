# Snake

![CI](https://github.com/abmsam/test/actions/workflows/ci.yml/badge.svg)
![Pages](https://github.com/abmsam/test/actions/workflows/pages.yml/badge.svg)
![Lighthouse](https://github.com/abmsam/test/actions/workflows/lighthouse.yml/badge.svg)

A classic Snake game with modern quality-of-life features and lightweight UI. Built with plain HTML/CSS/JS and designed to run fast on desktop and mobile.

## Live Demo

- https://abmsam.github.io/test/

## Status Page

- https://abmsam.github.io/test/status.html

## Features

- Classic grid movement with growing snake
- Difficulty levels with distinct speed and obstacle curves
- Level system with incremental obstacles and speed
- Timed and classic modes
- Power-ups (speed / slow)
- Wrap-wall mode toggle
- Local stats, leaderboard, and persistent settings
- Keyboard, on-screen, and swipe controls
- Auto-pause on blur (optional)
- Offline support (PWA)
- Diagnostics log with export

## Run Locally

Open `index.html` in any browser. No build steps required.

## Controls

- Move: Arrow keys (or rebind in UI)
- Pause/Resume: Space
- Restart: R
- Touch: Swipe on the board

## Project Structure

- `index.html` UI shell
- `style.css` Styling
- `game.js` Game logic and rendering
- `sw.js` Service worker (offline cache)
- `manifest.json` PWA manifest
- `scripts/checks.js` Basic repo checks
- `scripts/health-check.js` DOM sanity checks
- `scripts/accessibility-check.js` A11y checks
- `scripts/perf-check.js` Perf budget checks
- `scripts/release-notes.js` Release notes generator
- `scripts/update-changelog.js` Changelog updater
- `scripts/update-status.js` Status page updater
- `scripts/screenshot.js` Screenshot capture

## CI & Releases

- `CI` verifies required assets, DOM hooks, accessibility, and perf budgets.
- `Release` workflow updates CHANGELOG and publishes GitHub Releases.
- `Lighthouse` workflow generates performance reports.
- `Screenshot Regression` workflow captures baseline UI snapshots.

## Versioning

See `VERSIONING.md` and `RELEASES.md`.

## License

Private project unless you choose to publish otherwise.
