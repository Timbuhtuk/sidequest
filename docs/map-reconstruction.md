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
