# Seventh-pass character quality gate — stopped, not shipped

The user's seventh-pass brief explicitly says to stop and report if the body will not reach a good standard. The procedural prototype did not meet that bar. The live application has been restored to the incoming HEAD implementation, including its resting hands. This folder is an unimported experiment, not a new live character.

## Evidence and assessment

Local screenshots are in scripts/shots:

- seventh-body-orbit.png: occupied chair reads at distance, but the silhouette is stiff.
- seventh-body-mid.png: a real intermediate SIT frame, captured with Playwright's clock installed before app load. Shoulder caps and sleeve joins read as a mechanical assembly.
- seventh-body-lap.png: settled first-person downward view. The collar opening is oversized; chest, lap and arm connections do not read as continuous clothing.
- seventh-body-seat.png: forward first-person view.

The prototype uses a lofted shirt, trousers, knees, shoes, collar, head/hair silhouette and arm endpoints derived from the shoulders. The head is hidden near the first-person camera. These establish the intended continuity but do not establish acceptable character quality. Face-visibility guarantees across all camera paths were not verified.

A purpose-built stylised character asset is the recommended next step: local GLB, joined shirt/sleeve topology, seated trousers and shoes, simple hair silhouette, no detailed face, and a basic shoulder/elbow/wrist rig. Match the existing authored room materials. Start around 15–30k triangles and one or two materials as an asset budget, not a measured performance claim. The static body can be separated from the animated arms; a head mesh must be separately hideable in first person. Actual performance still needs real AMD hardware.

The saved integration.patch contains only the prototype changes to buildWorkspace.js and WorkspaceStage.jsx. buildSeatedFigure.js is saved alongside it. Neither is imported by the live app.

## Monitor finding

WorkspaceStage uses buildWorkspace's canvas screen texture before travel. DhruvOSScreen mounts the same-origin iframe lazily on the first non-room phase and keeps that instance mounted thereafter. Its alignment bridge is used during entering/leaving, not as a live display in the room. Therefore a synthetic key event alone cannot make pre-travel typing appear on the canvas screen. A real implementation needs an explicit input/model bridge and a room-visible display strategy. Synthetic KeyboardEvent dispatch also does not itself perform native text insertion; editable targets need input handling that preserves the OS application's state.

## Unfinished scope

- Enclosed side walls and approved angled corner, doorway and folded ceiling.
- Held-object contact offsets and clearance arcs.
- Lamp switch and persistent coffee drinking state.
- Liquid slosh attempt: not attempted; no cost or quality result.
- Removal of the desk anchor.
- Achievement object, drawer, blind cord and headphone state flag.
- Physical keyboard depression and OS typing integration.
- Drawer content slot: not built, so no live slot or format is claimed.

The prototype built successfully and the three review angles were inspected. It was rejected visually. The restored live app builds successfully. The full regression suite and idle-frame measurements were not rerun for this rejected experiment; prior 37/37 and idle results are historical, not verification of round seven. No hardware performance claim is made.
