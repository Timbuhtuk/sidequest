# The Witcher 3 — SIDEQUEST

Route: `/witcher-3`. Platform scope: Steam App 292030, base game + Hearts of Stone + Blood and Wine. The existing Deus Ex tracker and its storage are separate.

## Implemented

- All 78 Steam achievement entries (52/13/13), searchable Russian/English names and tracker-authored Ukrainian translations. Official hidden conditions are supplemented from guides, with a lower verification label.
- Now, Achievements, Journey, Collection. Ten navigation stages; explicit in-game event confirmations are separate from navigation and stage marks.
- Independent archive unlocks, branch action marks, stage marks and unique collected item IDs.
- 10 concrete action records for partially mapped complex goals, plus 12 optional tips without checkboxes. The 78 automatically generated achievement-condition actions have been removed. Simple achievements need no action chain and remain in Now recommendations independently.
- Independent standard and NG+ runs, branch notes, goals, decisions, unknown difficulty history, tracker checkpoints and validated JSON import/export.
- 11 individually tracked priority Gwent cards. The collection explicitly does NOT claim completeness. Its denominator never changes with filtering; branches and NG+ are not merged.
- Spoiler-safe search and per-entry reveals, keyboard-capable shared controls, responsive navigation, reduced-motion styles.

## Data boundaries

This is a manual local-device tracker, not an integration with Steam or game saves. Archive scope is `witcher3 + steam-292030 + local profile`. Other profiles/platform achievement sets are rejected on import. All game campaigns share one run; their action, stage, item and event IDs are disjoint. A checkpoint restores the entire selected run including its DLC state, never the unlock archive or another run. The UI states this explicitly. NG+ starts all tracker branch state empty and preserves archived unlocks; it does not model game inventory/level transfers.

The detailed route, all base-game Gwent cards, the Skellige deck, per-activity wedding entries, grandmaster diagrams, every collectible, every political prerequisite and every Blood and Wine ending condition are not fully researched. The site exposes coverage limitations and uncertainty instead of promising a complete 100% route. Known actions are grouped by their first relevant region; every displayed action chain is explicitly partial. Empty or partial chains never confirm all achievement requirements.

The political preparation bundle is split into three named pre-Isle quests and a separate later conversation with Dijkstra. No old bundle mark fills these new entries. Difficulty history remains a persistent run condition, not an action checkbox. Planning, saving and broad checklist advice are optional text. Earned goals do not generate Now recommendations; a step remains relevant if another linked goal is unearned. Earned marks never fill actions or decisions.

## Catalog-v1 compatibility

The storage key and envelope version remain unchanged. Catalog version 2 accepts catalog-v1 saves and imports. `lib/witcher-legacy-steps.ts` is an explicit whitelist of 91 retired IDs: the 78 generated condition-actions and 13 removed or replaced preparation records. `parseState` migrates both runs and snapshots: real action marks stay in `completedSteps`, retired marks move to `retiredSteps` and are retained through export and checkpoint restoration. Known history is excluded from recommendations, requirements and counters; unknown IDs still reject the import. Migration does not write over the original browser save on load and never awards achievements or guesses newly split actions. New runs and NG+ start both lists empty. The Data dialog explains historical marks when present.

Potentially missing cards after a confirmed event remain unknown unless the player verifies inventory. An unchecked card is not treated as a proven loss. No counter or completed checklist awards an achievement automatically. Difficulty reductions from Death March cannot prove failure of the lower difficulty trophy without further information.

## Sources and verification

Content checked 2026-09-02. The source registry lives in `lib/witcher-data.ts`; the reproducible Steam catalog fetch is `scripts/fetch-witcher.ps1`. Steam lacks Ukrainian strings for this catalog; the site uses authored Ukrainian translations rather than mislabeling its English fallback.

- Steam catalog: https://steamcommunity.com/stats/292030/achievements
- Full Crew: https://www.gamerguides.com/the-witcher-3-wild-hunt/guide/walkthrough/the-wild-hunt/gather-allies
- Gwent: https://www.gamerguides.com/the-witcher-3-wild-hunt/guide/gameplay/advanced-tips/ultimate-gwent-witcher-3-guide
- Masquerade: https://www.gamerguides.com/the-witcher-3-wild-hunt/guide/secondary-quests/novigrad/a-matter-of-life-and-death
- Difficulty: https://www.gamerguides.com/the-witcher-3-wild-hunt/guide/walkthrough/tutorial/difficulty-options-differences
- Woodland Spirit: https://witcher.fandom.com/wiki/Woodland_Spirit_(achievement)
- Other conditions: https://www.xboxachievements.com/game/the-witcher-3-wild-hunt/guide/

Artwork is the game's official Steam store header, used on its library card, route banner and route-specific social preview. SIDEQUEST and Deus Ex previews remain unchanged. The fetched screenshot is retained as source artwork but is not used as a geographic map.

## Validation

`node scripts/check-witcher-actions.mjs` includes the baseline `check-witcher.mjs` suite and tests the full action catalog, empty/simple goals, partial multi-region chains, catalog-v1 runs and snapshots, historical mark preservation, migration idempotence, invalid IDs and earned-goal recommendations. It server-renders the real guidance component in RU/UK/EN and the tracker with its shared sources and summary. TypeScript and a coordinated production build are required. These are not a claim of browser visual/keyboard testing.
