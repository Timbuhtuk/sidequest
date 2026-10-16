# SIDEQUEST

Manual achievement trackers for Deus Ex, The Witcher 3, and Assassin's Creed Valhalla.

## Assassin's Creed Valhalla

The third library card opens `/ac-valhalla`. The Steam 2208920 catalog contains 92 achievements: 50 for the base game and 42 for expansions and updates (9 Ireland, 9 Francia, 9 Ragnarok, 9 Forgotten Saga, 3 Mastery Challenges, and 3 Tombs). The data was checked on September 3, 2026.

The tracker uses the same navigation structure: Now, Achievements, Route, Collection, a collapsible panel, checkpoints, independent playthroughs, and import/export. Achievement, action, region, and 19 fish species marks are independent. The `sidequest.valhalla.steam2208920.profile.local.v1` save is isolated from other games. The Forgotten Saga elk shrine condition accounts for an unknown state and the current run. Playthroughs start with an empty list; NG+ and inventory carryover are not modeled.

Limitations: the route covers regions and key preparation rather than every quest and subquest; only fish for Good Catch have individual collection entries. There is no complete catalog of wealth, mysteries, artifacts, or a geographic map. The interface, route, and fishing content support RU/UA/EN; Ukrainian achievement titles and visible conditions currently use the English Steam text. Hidden conditions were supplemented from a reference guide. The repeated Steam icon for Dreamcatcher/Godly Reward is not used as a unique tracker identity: Dreamcatcher has its own ID and corrected title and condition.

Sources: [Steam](https://steamcommunity.com/stats/2208920/achievements), [achievement conditions](https://steamcommunity.com/sharedfiles/filedetails/?id=3370462114), [base game route and rules](https://www.powerpyx.com/assassins-creed-valhalla-trophy-guide-roadmap/), and [fish species](https://www.powerpyx.com/assassins-creed-valhalla-all-fish-locations/). Cover art and imagery are official Steam/Ubisoft materials.

The existing validation record covers `node scripts/check-valhalla.mjs` for the catalog, relationships, and saves, including rejection of unrelated or damaged imports. Types, the build, and an HTTP 200 response from the new page were also checked. Browser interactions and visual checks were not performed in that validation pass.

## Library

The `/` homepage is a game-independent library with a black-and-white pixel design. Parallax responds to scrolling and the pointer and is disabled by `prefers-reduced-motion`. The interface supports UA/RU/EN. The Deus Ex card reads the existing save and displays earned achievements without modifying it.

The Deus Ex tracker is at `/deus-ex`, with a link back to the library. Its localStorage keys, save format, and manual marks are preserved. The homepage and game page have separate link titles and images.

## Deus Ex — Achievement Protocol

A multilingual MVP with manual progress updates: 81 achievements, stage selection, key story decisions, playthrough conditions, book and Breach counters, notes, up to 12 checkpoints, and JSON import/export.

The interface, all 81 achievements, instructions, stages, decisions, hints, and messages support Ukrainian (UA), Russian (RU), and English (EN). The language switcher is at the bottom of the sidebar and is also available on phones. Language is saved as a separate browser preference; playthrough data, notes, and checkpoint names do not change. Search uses the current language. Ukrainian translations were prepared for the tracker; English achievement titles were checked against Steam.

State is stored in this browser's localStorage. Restoring a checkpoint rolls back the playthrough while preserving earned achievements. Counters do not mark achievements automatically. There is no Steam or game integration.

“Achievement earned” is the single achievement flag shared by all playthroughs. Earned achievements are immediately removed from recommendations and remain in the archive. The current stage and “Stage completed” checkboxes are independent of each other and of achievements. Three progress bars show all earned achievements, completed campaign stages, and earned achievements in the current stage. Conditions and reminders are hidden when their related achievements have already been earned; preparation for unearned achievements remains visible.

Version 1 saves load without data loss. The obsolete `completedTasks` field is retained for export compatibility but is not displayed and does not affect recommendations or statuses. Starting a new playthrough or restoring a checkpoint does not return earned achievements to the task list. Counters for earned collection achievements are hidden while retaining their values.

Instructions are based on the sources linked in the interface and the research in the neighboring `docs` folder. Fourteen multistage and missable achievements have numbered routes with failure-point warnings; other cards use compact hints. The map is a stage diagram rather than a geographic map. All 75 eBooks are individual manual objectives assigned to stages and saved with the playthrough and checkpoints.

## Development

Requirements: Node.js 22.13+ and pnpm. Run `pnpm install`, then `pnpm dev`.

`pnpm build` builds the site. `pnpm exec tsc --noEmit` checks types. `node scripts/check-tracker.mjs` checks the catalog, branches, and state persistence.

Third-party installation scripts are not allowed in `pnpm-workspace.yaml`; supplied platform binary packages are used instead.

## Validation record

The existing validation record covers types, 81 unique identifiers with a 46/8/10/17 distribution, serialization/import, rejection of invalid imports, branch effects, independence of earned achievements from branch state, and checkpoint restoration.

Browser visual testing was not performed in that pass. WebMCP was checked in a local browser with `get_tracker_progress`, `set_achievements`, and `set_playthrough_progress`. Earning an achievement removes it from recommendations; clearing its mark restores it. Stage changes do not affect achievements. Negative WebMCP calls using the obsolete `tasks` kind or an unknown ID were stopped by automatic safety review before reaching the application, so handling of those errors through WebMCP was not verified. The original state was restored afterward.

Localization checks cover completeness of both dictionaries, untranslated JSX text, stable catalog identifiers and relationships, translated error messages, and localized search text. `set_tracker_language` changes only the interface language.
