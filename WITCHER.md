# The Witcher 3 — SIDEQUEST

Route: `/witcher-3`. Platform scope: Steam App 292030, base game + Hearts of Stone + Blood and Wine. The existing Deus Ex tracker and its storage are separate.

## Implemented

- All 78 Steam achievement entries (52/13/13), searchable Russian/English names and tracker-authored Ukrainian translations. Official hidden conditions are supplemented from guides, with a lower verification label.
- Now, Achievements, Journey, Collection. Ten navigation stages; explicit in-game event confirmations are separate from navigation and stage marks.
- Independent archive unlocks, branch action marks, stage marks and unique collected item IDs.
- 19 preparation actions and one condition-action per achievement. Preparation is shared across relevant goals rather than duplicated.
- Independent standard and NG+ runs, branch notes, goals, decisions, unknown difficulty history, tracker checkpoints and validated JSON import/export.
- 11 individually tracked priority Gwent cards. The collection explicitly does NOT claim completeness. Its denominator never changes with filtering; branches and NG+ are not merged.
- Spoiler-safe search and per-entry reveals, keyboard-capable shared controls, responsive navigation, reduced-motion styles.

## Data boundaries

This is a manual local-device tracker, not an integration with Steam or game saves. Archive scope is `witcher3 + steam-292030 + local profile`. Other profiles/platform achievement sets are rejected on import. All game campaigns share one run; their action, stage, item and event IDs are disjoint. A checkpoint restores the entire selected run including its DLC state, never the unlock archive or another run. The UI states this explicitly. NG+ starts all tracker branch state empty and preserves archived unlocks; it does not model game inventory/level transfers.

The detailed route, all base-game Gwent cards, the Skellige deck, per-activity wedding entries, grandmaster diagrams, every collectible, every political prerequisite and every Blood and Wine ending condition are not fully researched. The site exposes coverage limitations and uncertainty instead of promising a complete 100% route. Most basic action records summarize achievement conditions; they are not complete walkthroughs.

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

`node scripts/check-witcher.mjs` tests catalog counts, locale coverage, IDs/relations, independent state layers, partial-collection semantics, ordinary/NG+ runs, checkpoints, strict imports, unknown conditions and blocker evaluation. It also checks source-level spoiler/storage safeguards. TypeScript and a production build are required. These are not a claim of browser visual/keyboard testing.
