# SignedTurn

`SignedTurn` draws total signed rotation, not just a normalized angle. `angle`
and `onAngle` form a controlled pair; omit them for local state. All angles are
degrees, anticlockwise positive. `start={90}` starts up; `angle={-90}` then ends
right. The default interaction range is −720 through 1080 degrees.

The ghost ray marks the start. An arrow on the sweep marks direction, while
the complete-lap readout distinguishes 30 from 390. At 360 the full circle
remains visible. Keyboard arrows change one degree, Shift changes fifteen;
`step` scales those increments. The number field reaches exact total values.
Pointer movement unwraps consecutive endpoint samples across zero.

`readouts={false}` hides numeric notation and the number field, retaining the
keyboard/pointer handle; provide a lesson-specific `description` before units
are introduced. `interactive={false}` removes the handle. `axes`, `quadrants`
and `divisions` are optional drawing layers. `radius` changes arm length in a
fixed drawing frame, so equal-sized figures can compare lengths honestly.
The figure has no autoplay or transitions; every state change is immediate.

ArcWrap is unchanged and remains the legacy unsigned 0–360 figure.

## RadiusStrips

`RadiusStrips` accepts an exact `radians` value independently of its physical
`radius`. `scaleRadius` fixes the shared frame: use the same value for both
members of a comparison. Doubling `radius` then doubles the drawn circle and
arc while preserving its opening. `wrapped` reveals the curved strips;
`unwrapped` adds a ruler of the arc divided into radius lengths. The straight
reference strip below the circle uses the circle's scale. `labels={false}`
hides numeric readouts for the initial prediction. Lessons own reveal buttons,
units, captions and the sequence of comparisons; these figures have no autoplay.
