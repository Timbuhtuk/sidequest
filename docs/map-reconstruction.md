# Map reconstruction

The map viewer renders Three.js meshes, not a textured plane or CSS-transformed
image. Source sheets remain available as references. The original full-resolution
image URLs and file-description pages are recorded in `public/maps/plans/sources.json`.

## Geometry

`scripts/build-map-models.py` separates the source sheets into levels, extracts
floor contours with holes, and traces bright wall-top segments. It removes legends
and saturated item symbols, filters shadow edges, and repairs self-touching polygons
before extrusion. Stair hatching is masked in the three small Prague models and
replaced with schematic U-shaped stair flights. The renderer constructs thick floor
slabs, wall solids, and step solids. No source texture is loaded into the 3D scene.

The cleanup pass recognizes pale/pink stair ramps across all source sheets,
merges collinear duplicate observations without closing door-sized gaps, and
unions wall footprints before extrusion. Intersections share one solid boundary
instead of overlapping box faces. Floor extraction includes dark red surfaces;
shaft outlines follow the plan's dominant axes while preserving non-rectangular
openings. Existing floor registration is retained.

The offline authoring script requires Python, Pillow, NumPy, OpenCV and Shapely.
The generated model JSON files are checked in; running the website does not require
Python or image processing. The engine and selected model are loaded on demand.
Render frames are requested only after interaction, resize, or display changes.

## Current coverage and fidelity

- 10 interior models with 54 source levels, plus the Prague city overview (one ground layer, 29 exterior block volumes). These are reconstructions, not extracted game meshes.
- TF29, Zelen Apartments and The Time Machine are aligned using repeated stair/lift
  locations. G.A.R.M. is aligned using repeated hangar corners.
- Dubai, London, Palisade Bank, Ridit Station, RVAC Row and Štědrý use automatic
  translation matching. They open on a single level and visibly disclose that
  their inter-floor registration still needs manual verification.
- 45 named locations use full-resolution source pixel coordinates transformed by
  the same per-floor registration as the meshes. A geometry test checks that each
  marker lies on its declared floor. This verifies placement in the reconstruction,
  not the correctness of all underlying game information.
- Heights, wall thickness and staircase rise are schematic. The plans do not contain
  reliable metric elevations. Some small door gaps, machinery and partial railings
  remain ambiguous; traced lines must not be treated as a surveyed collision map.
- The Throat source sheet is retained as a reference but is not reconstructed.
  The viewer does not claim full game
  coverage or verified coordinates for achievements/collectibles.

## Verification

`node scripts/check-dx-map.mjs` triangulates every floor using the production Three.js
library and checks finite vertices, positive solid thickness, unique floor elevations,
triangle area against polygon area minus holes, localization, marker-to-floor validity,
and source-sheet bounds. `scripts/check-tracker.mjs` covers preservation of the
independent achievement and campaign states. `scripts/check-map-cleanup.py` checks
door gaps, rectangular/L-shaped holes, non-overlapping wall footprints, and the
bank's reported stair-hatching and dark-red-floor defects. Model format 3 and a
versioned asset URL prevent loading cached box-wall data into the new renderer.
Browser interaction testing was not run.

Stair symbols are resolved into shared connections between adjacent floors,
with explicit destination floors and a rise derived from both elevations. A pair
of symbols generates one flight; a lone highest-floor symbol describes a descent.
TF29 has only the 1–2 connection: its level 3 storefront does not create a second
stair flight. Connections render independently of floor groups so isolating the
upper floor retains its descending stairs. Upper slabs have landing openings.
`scripts/check-map-stairs.py` covers these cases and all generated connections.

For further accuracy work, record explicit source landmarks and physical correspondences
before replacing an automatic registration. Inspect the full-resolution plans and
manually classify doors, staircases, shafts and rails; do not promote an automatic
reconstruction to a verified game map based only on successful rendering.

## Prague line-art experiment

At the user's request, an asset-only agent generated label-free black line art
from the supplied infrastructure image. `public/maps/plans/prague-lines.png` is
that 1536×1024 intermediate, not a hand-traced survey. `build-prague-model.py`
floods its enclosed regions, rejects street/courtyard regions against the raw
6000×4000 reference resized into the same frame, and vectorizes the survivors.
Fifteen source groups retain generated contours; eleven use source-mask corrections
because their intersection-over-union score is below 0.82. Tiny holes and shared
boundaries are dissolved before extrusion. The final 29 polygons are city blocks,
not a claim of 29 individually surveyed buildings.

The eye estimate of a 20° clockwise rotation was refined to 20.225° from long
edges. The source already represents a top-down orthographic plan, so no invented
camera pitch or perspective stretching is applied. The rectifying rotation and
uniform source resize are stored in `sourceTransform` and used for both meshes
and original-resolution place coordinates. Before/after SVGs and the generated
raster are retained; the side panel links to the rectified contours for inspection.

Every block has a schematic height of 6 scene units, not a measured height or floor
count. Courtyards are true holes through the building volumes. A morphological
ground plinth is a display base, not an inferred walkable area. Interiors, roof
forms, facades, street elevations and city stairways are not reconstructed here.
The existing detailed interior models remain selectable separately.

`check-prague-model.py` checks disjoint valid footprints, preserved courtyard,
square and railway witnesses, named building coverage, and a distance/angle
preserving source transform. The shared Three.js triangulation check also checks
city footprint hole areas and all 45 marker positions. Detailed source comparison
scores are recorded in `prague-line-map-report.json`.

Prague volumes containing the bank, Zelen, Time Machine and Praha Dovoz landmarks
open their existing interior models on click. The link is resolved from the shared
source-coordinate transform and footprint containment, so regenerating block IDs
does not break navigation. Labels and the place list offer the same navigation;
the interior header provides a return to Prague. The geometry check requires one
linked volume per interior and validates every destination against the registry.

The renderer assembles floors with a pitch of wall height plus slab thickness
(3.15 scene units for interiors), placing each upper slab against the lower walls.
Source elevations retain floor ordering; rendered positions and stair rises use
`modelFloorElevation`. Exploded mode expands that pitch and the connecting stairs.
Selecting a level updates existing objects in place without resetting the camera:
the selected floor stays opaque (unless X-ray is explicitly enabled), other floors
use 10% opacity with faint edges and no depth writes. Context floors do not intercept
selection; only active-floor labels and markers are shown. Stair connections remain
visible and are emphasized when either endpoint is selected. No geometry reload is
performed for a floor selection.

## Icon-free interior wall references

TF29 levels 1 and 2 and Palisade Bank level 8 now trace walls from the reviewed
generated crops in `public/maps/plans/cleaned/`. The crops are normalized back to
their exact source-sheet bounds. Their color shading is not used to regenerate
floors: all original floor shapes, holes, stair connections and registration
coordinates remain identical. Stair hatching is still suppressed before tracing.
The yellow-icon filter is disabled for these icon-free inputs because it would
otherwise erase genuine golden wall outlines in the generated palette.

Each affected floor records `wallSource`; the app requests the updated asset
revision. Unified wall footprints are regenerated, preserving the existing
assembled-floor and translucent-context behavior. `review-cleaned-wall-models.py`
compares the update against the saved pre-update models and creates overlays on
the original source for review. The cleanup, stair and Three.js geometry checks
passed. These remain schematic reconstructions: generated details formerly hidden
by icons should not be treated as independently verified game geometry.

## TF29 level 2 source corrections

The NSN/server east wing is manually reconciled with the original full-resolution
sheet in `map_manual_refinements.py`. Short door jambs missing from automatic
tracing are restored; adjoining segments meet in the unified wall solid. The
oblique slab shadow is excluded from walls. Two shaded occupied rooms (east wing
and cyber room) are filled instead of being treated as floor voids. The central
atrium and stair openings remain intact. These explicit corrections supersede
the unchanged-floor comparison for TF29 level 2 in the earlier icon-free update.

The cleanup check covers both room floors, the real atrium, three door gaps,
the removed shadow wall, and the connected east corner. The source correspondence
is guarded so a changed automatic trace requires review before rebuilding.

## Cross-model source recovery (superseded for interiors)

`map_source_recovery.py` supplements all 54 interior floors from original sheets.
Gold exclusion now isolates broad icon shapes rather than removing every golden
pixel. Source-supported strokes down to 8 pixels can restore short jambs and wall
sections. Candidates follow the plan axes and must lie at the existing floor;
unsupported strokes from cleaned images are discarded. The manually reviewed
TF29 east wing remains protected. Only perpendicular corner gaps within 5 source
pixels are joined; collinear gaps are retained for doorways. Wall footprints are
repaired at the output precision before triangulation.

`reviewed-floor-shadows.json` records 35 visually reviewed source-space witnesses
across seven locations. Their narrow wall-side shadows are filled; other voids,
floor boundaries, registration and staircase connections are preserved. Rebuilds
fail if a witness no longer matches exactly one hole, requiring fresh review.
`check-map-source-recovery.py` covers icon/wall color ambiguity, short jambs,
corner connections, open doors and each of those 35 occupied-floor points. These
checks supplement the existing atrium, stair and triangulation regressions; they
do not establish accuracy in areas hidden by annotations in the source sheets.

## Regenerated flat plans — current interior pipeline

All 10 interiors now use 58 individually regenerated plans for 54 physical
floors. Each crop was edited with the built-in image generation tool: gray
horizontal floor, white wall tops, black exterior/real voids and cyan stair
footprints. Icons, labels, grid, lighting and vertical shadow faces were removed.
The selected assets, exact source crops, prompts and inspection notes are in
`public/maps/plans/flat-v2/manifest.json`; original source sheets remain alongside.

Run `python scripts/build-flat-map-models.py` from the Site directory to stage
models in `outputs/flat-models`. This is the current rebuild entry point;
`build-map-models.py` documents the former pipeline and supplies stair metadata.
White connected ribbons are vectorized into wall solids directly, retaining
short wall ends and junctions. No legacy line detection or source-wall recovery
is added to these solids. Gray and cyan surfaces form floor polygons with black
voids retained. Existing verified stair links cut their destination floor slabs.

Bounded affine registration corrects small framing changes against the original
wall-top coordinates. Separate buildings may be registered independently when a
whole-sheet fit fails. Original pixels provide registration only, never extra
wall or floor geometry. `generatedParts` stores the transform and fit metrics.
Dubai now separates seven labelled subplans instead of mixing different levels
within three image crops. RVAC level 1 includes its previously cropped top edge.

Before copying staged models into `public/maps/models`, run
`python scripts/check-flat-map-models.py --complete` and
`node scripts/check-dx-map.mjs outputs/flat-models` (copy the unchanged Prague
model into staging for the latter). Checks cover source completeness, polygon
validity, overlapping solids, open stair arrivals and Three.js triangulation.
They do not establish exact correspondence to the game. Generation can still
interpret obscured details imperfectly, and multi-floor registration remains a
draft reconstruction where the source lacks common landmarks.
