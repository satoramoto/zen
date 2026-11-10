# Measured, glasses-free stereo illusions

`Math/Stereo/Components/Stereo Illusion Lab` adds five random-dot scenes: a ring, bowl/dome reversal,
saddle, radial ripples and hidden ZEN lettering. Parallel and crossed viewing share
the same physical geometry. Phase and patterns change only on explicit interaction;
there is no autoplay or flicker. The default is now Look & Tune, a visual sitting-distance and spacing setup. The large,
draggable motion-depth surface remains available without fusion or physical calibration.

Stereo is a separate viewing choice. Start with complementary bars that form a cross in
the fused middle image, continue to a visible ring, then try the hidden random-dot relief.
Progress is self-reported; the app cannot detect fusion. Returning to motion depth is always
available. Escape or hiding the page removes an active stereo pair.

## Calibration and geometry

A ruler-matched 50 mm line determines **CSS pixels per physical millimetre**. DPR only
controls the canvas backing resolution. Do not use CSS `mm`, a guessed monitor diagonal,
or DPR as physical calibration. The [W3C absolute-length specification](https://www.w3.org/TR/css-values-3/#absolute-lengths)
explains why screen CSS lengths may be anchored to reference pixels instead of physical units.

Viewing distance D and eye separation I are explicit inputs, initially **estimates** of
600 and 64 mm. The viewer should replace them with their own measurements. Calibration
is local to the mounted lab, not stored as a universal monitor profile. Resize, detected
DPR/visual-viewport-scale change and fullscreen transitions invalidate it and remove the
fusion pair. Some monitor moves are undetectable: the UI asks for a manual recheck.

Image width w and gap g determine physical center separation S = w + g. The base screen
parallax q (right-eye position minus left-eye position) is +S for parallel viewing and
−S for crossed viewing. The reference vergence distance is:

```
Z = D I / (I − q)
phi = 2 atan((I − q) / (2 D))
```

The monitor is **not** the free-viewed reference plane. Using zero image disparity as
zero screen-relative depth would misreport the entire scene. For relative height h and
angular strength A, the renderer uses phi' = phi − h A and derives q' from that angle.
The local per-eye shifts are ±(q' − q)/2. Crossed viewing swaps the eye images' positions;
it does not accidentally reverse the requested relief. Positive h is farther away.

Widths fit the measured container without stretching the canvas. Parallel center separation
is capped at 0.72 I; angular relief is capped at 20 arcminutes and 35% of base convergence.
These are implementation bounds to retain convergent geometry, **not validated universal
comfort limits**. Actual effective width and strength are displayed. Small pairs are
intentional; enlarging the browser page requires recalibration.

[Stereo-display research](https://doi.org/10.1167/11.8.11) shows that viewing distance and
vergence–accommodation conflict matter to discomfort. Manual geometry cannot guarantee
comfortable fusion. The UI provides shallow initial relief, 2D rest, zero depth, explicit
viewing guidance and a reminder to reduce the effect if fusion feels effortful. No camera,
head tracking, medical measurement or physiological prediction is performed.

## Renderer and public primitives

- `DotStereoView`: physical viewer and layout, a built-in scene or custom `heightAt(x,y)`
  field (finite normalized heights in −1…1), relief, phase, seed and depth inversion.
  It renders physically sized eye images. A caller must first fit the layout.
- `MotionRelief`: a rotatable point cloud from the same relief field, with an optional mesh.
- `FusionTargets`: physically sized complementary alignment crosses and visible depth rings.
- `DisplayCalibration`: the adjustable ruler reference and explicit confirmation.
- `useDisplayInvalidation`: lifecycle hook for invalidating a host's measurement on
  detected display changes; the lab wires it to calibration and the active pair.
- Framework-free `StereoViewer`, `StereoLayout`, `fitStereoLayout`, `depthRange`,
  `reliefParallax`, `eyeImageShift`, `vergenceAngle` and `vergenceDistance`.

The rasterizer forward-warps one deterministic noise field per eye. A depth buffer keeps
the nearer sample at collisions; disocclusion gaps receive independent noise. The configurable dot pitch is scaled into backing pixels (0.3 mm primitive default;
0.6 mm initially in the lab, adjustable to coarser dots). Pixel rounding limits attainable subpixel
disparity, especially on low-density displays. The model uses a single-valued relief field;
it is not a general retinal ray tracer. Depth inversion changes the field before visibility
and shifts are computed, rather than blindly exchanging finished images.

The optional enlarged depth map is separate from the fusion pair. Its theme-derived
luminance palette is ordered so that brighter always means farther, including light themes.
Component stories use clearly labeled synthetic calibration fixtures. They cannot establish
the physical scale or visual fusion on the human viewer's monitor.

## Validation

Pure tests check ray intersections, parallel/crossed reference depth, angular relief,
DPI independence, bounded convergence, image fitting and zero-relief correspondence.
The lab story and `scripts/stereo-illusion-stories.mjs` check measured CSS dimensions,
actual canvas pixels, eye order, depth reversal, viewing distance, Escape, resize
invalidation, phase, narrow layout and DPR=2 backing resolution. Full-page screenshot
capture can transiently resize a browser viewport, so the active measurement is captured
with an element screenshot; normal resize behavior remains enabled. Human fusion and
comfort cannot be established by browser tests. `scripts/stereo-guide-stories.mjs` also
checks pointer/keyboard rotation, reset, the guided targets, adjustable dot size, returning
to motion, and narrow/light layouts.

## Look & Tune

`StereoIllusionLab` opens `StereoTuner` by default; `startIn="motion"` preserves the motion-first
entry. The Look And Tune story demonstrates the default, while older scene stories retain
motion-first fixtures for comparison. The reusable tuner has its own component stories.

The sitting-distance slider changes the separation using `2 D tan(a/2)`, where `a` is the
requested angular spacing. Target spacing then fine-tunes that angle directly. Separation
is capped by available space and 65% of the estimated eye spacing; the same layout is carried
from the alignment cross to the ring and continuous pattern. The marks keep their position
through the transition. Narrow layouts keep the target card visible while scrolling the sliders
(except short viewports, where normal scrolling preserves access to every control).

This is subjective tuning, not automatic calibration. Initial CSS scale (3.8 px/mm), distance
(600 mm) and eye spacing (64 mm) are estimates. Optional ruler calibration remains available.
Detected display changes pause the experience and return to alignment. Scene changes preserve
settings; switching viewing method returns to alignment. Escape rests the display. Nothing
animates automatically and no camera is used.

`Stereogram` renders a continuous patterned image using row-wise symmetric correspondence
constraints, based on the algorithm described by [Thimbleby, Witten and Inglis](https://harold.thimbleby.net/sirds/ieee3d.pdf).
The repeat distance comes from the same signed screen parallax as the paired renderer. Crossed
viewing reverses the relationship between unsigned repeat distance and relief, preserving the
intended depth direction. The raster uses four theme colors; pattern grain controls sample size
in CSS pixels. Integer sample rounding limits attainable disparity. This implementation targets
shallow relief and does not perform hidden-surface removal; steep/discontinuous surfaces can
produce conflicting correspondences or echoes. It is not a general scene renderer.

Tests verify flat-field periodic correspondence, deterministic relief encoding, seat-distance
scaling, bounds and crossed/parallel depth sign. `scripts/stereo-tuner-stories.mjs` verifies live
sliders, unchanged alignment mark position, actual pattern pixels, both viewing methods, scene
changes, rest/resume, display invalidation, themes and narrow layouts. These checks cannot
establish human fusion or comfort.
