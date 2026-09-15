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

The offline authoring script requires Python, Pillow, NumPy, OpenCV and Shapely.
The generated model JSON files are checked in; running the website does not require
Python or image processing. The engine and selected model are loaded on demand.
Render frames are requested only after interaction, resize, or display changes.

## Current coverage and fidelity

- 10 models, 54 source levels. These are reconstructions, not extracted game meshes.
- TF29, Zelen Apartments and The Time Machine are aligned using repeated stair/lift
  locations. G.A.R.M. is aligned using repeated hangar corners.
- Dubai, London, Palisade Bank, Ridit Station, RVAC Row and Štědrý use automatic
  translation matching. They open on a single level and visibly disclose that
  their inter-floor registration still needs manual verification.
- 36 named locations use full-resolution source pixel coordinates transformed by
  the same per-floor registration as the meshes. A geometry test checks that each
  marker lies on its declared floor. This verifies placement in the reconstruction,
  not the correctness of all underlying game information.
- Heights, wall thickness and staircase rise are schematic. The plans do not contain
  reliable metric elevations. Some small door gaps, machinery and partial railings
  remain ambiguous; traced lines must not be treated as a surveyed collision map.
- Prague's street overview and the Throat source sheet are retained as references,
  but are not reconstructed in this model set. The viewer does not claim full game
  coverage or verified coordinates for achievements/collectibles.

## Verification

`node scripts/check-dx-map.mjs` triangulates every floor using the production Three.js
library and checks finite vertices, positive solid thickness, unique floor elevations,
triangle area against polygon area minus holes, localization, marker-to-floor validity,
and source-sheet bounds. `scripts/check-tracker.mjs` covers preservation of the
independent achievement and campaign states. Browser interaction testing was not run.

For further accuracy work, record explicit source landmarks and physical correspondences
before replacing an automatic registration. Inspect the full-resolution plans and
manually classify doors, staircases, shafts and rails; do not promote an automatic
reconstruction to a verified game map based only on successful rendering.
