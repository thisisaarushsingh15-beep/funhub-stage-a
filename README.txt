FunHub Epic Simulation Test Build

This is a TEST build for the funhub-stage-a GitHub Pages repository.

New game architecture:
- World Conquest: single-player grand-strategy campaign with a world-style map, provinces, AI expansion, economy, morale, industry, research, diplomacy, army management, pan/zoom and a full-screen command mode.
- Pirate Empire: exploration/simulation game with an ocean map, ship movement, islands, discoveries, trading, crew, cargo, repairs, reputation and random events.
- Precision AI Lab: fictional non-weapon AI calibration simulation with moving virtual targets, adaptive waves, combo scoring, energy and focus pulse.
- Survival Outpost: defense simulation with a base, escalating creature waves, energy, scrap, repairs, barrier upgrades and perimeter interaction.

All four game pages are standalone HTML+JS experiences and include the required scripts in this package.

Mobile design:
- Game canvas occupies the available screen.
- Controls are overlaid on the map.
- Back and full-screen buttons are overlaid.
- Full-screen depends on the browser allowing the user-gesture requestFullscreen API; if unavailable, use the browser's own full-screen/page controls.

IMPORTANT:
- Test this package only on funhub-stage-a first.
- Do NOT upload it to the live funhub repository until every game is tested.
- The test pages are intentionally independent of the old simple Stage B game engines.
