# math-primes Specification

## Purpose
The prime-wave figures: the pictures of primes as waves, live and adjustable, each saying what its pattern comes from.

## Requirements

### Requirement: Figures follow the bindable contract

Every prime-wave figure SHALL take each of its quantities as a prop with a matching `on<Prop>` callback, keep its own state when a prop is not given, draw only with the contract's variables (a raster reads its colours from them and repaints when the theme changes), describe its current state in its accessible name, be operable by keyboard, and have a story whose play exercises it.

#### Scenario: A bound prime count

- **WHEN** a page binds a figure's `count` to a quantity and the reader scrubs it
- **THEN** the figure redraws with that many primes and its description says so

### Requirement: BoundaryWaves

BoundaryWaves SHALL draw the first N primes (N from 1 to 60) as standing waves between two walls, prime p having p half-waves, stacked one per row or overlaid. With marks on, it SHALL mark each wave's interior nodes (at k/p of the width) and report the closest approach between marks of two different primes.

#### Scenario: Marks never meet

- **WHEN** marks are on for the primes 5, 7, 11 and 13
- **THEN** no two marks of different primes coincide, and the figure reports the closest approach as 1/143 of the width (a mark of 11 and a mark of 13)

### Requirement: WrappedWaves

WrappedWaves SHALL wrap each prime's wave round a circle (radius 1 plus a small amplitude times the wave), drawing each as a closed curve for up to 60 primes and as a density disc, built from the same curves, for up to 100,000.

#### Scenario: From curves to a disc

- **WHEN** the count goes from 4 to 50,000
- **THEN** the figure turns from four separate curves into a shaded disc and says how many waves it holds

### Requirement: RingField

RingField SHALL paint, inside a disc, the sum over the first N primes (up to 100,000) of cos(2π·p·r) at each radius r from 0 to a chosen extent, normalised, so rings form where the waves agree. It SHALL have a resolution control (pixels across the disc) and a choice between each pixel taking the field at its own radius and each pixel averaging it over its width, and SHALL say in words what each view shows and that the video's cross and moiré are not made by this construction.

#### Scenario: What a pixel holds

- **WHEN** the reader ticks Average each pixel with the count fixed
- **THEN** rings at other simple fractions (a third, a quarter, a sixth) appear beside the rings at whole numbers and halves, and the caption says the fine waves have cancelled and the smallest primes' slow waves are left

#### Scenario: Saying what is not reproduced

- **WHEN** the figure is drawn in either view
- **THEN** the caption says that the video's cross and moiré near the centre are not made by this construction

#### Scenario: Rings at simple fractions

- **WHEN** the field is drawn for 20,000 primes out to radius 3
- **THEN** it is brightest at whole-number radii and darkest at halves, and the figure says this is because every prime but 2 is odd

### Requirement: GapSpectrum

GapSpectrum SHALL take the gaps between the first N primes, play each gap g as a short tone at g times a base frequency, run a Fourier transform of the whole signal, and draw its magnitude spectrum beside the histogram of gap sizes, with the matching spike and bar marked together. It SHALL also offer the prime indicator (1 at a prime, 0 elsewhere) as the signal, whose spectrum peaks at simple fractions of the sampling rate.

#### Scenario: Spikes are the gap counts

- **WHEN** the spectrum of the gaps of the first 10,000 primes is drawn
- **THEN** its spikes fall at the gap sizes times the base frequency (even multiples, apart from the single gap of 1 between 2 and 3), the tallest at 6, and each spike's height is proportional to its bar in the histogram

#### Scenario: The indicator's fractions

- **WHEN** the signal is switched to the prime indicator up to 100,000
- **THEN** apart from zero, the spectrum's largest peak is at ½ of the sampling rate and the next at ⅓ and ⅙, and the figure names them

### Requirement: BoxField

BoxField SHALL paint over a square the sum over the first N primes (up to 2,000) of cos(2π·p·x)·cos(2π·p·y), normalised, with the same resolution control and wording as RingField about which features are the sampling's.

#### Scenario: Fourfold symmetry

- **WHEN** the field is drawn
- **THEN** it is symmetric under swapping x and y and under reflection in either midline, and the figure says the symmetry is the square's own

### Requirement: FieldShape

FieldShape SHALL show BoxField's values as a 3D surface (height and colour from the value) and, by a switch, the same values on a sphere (x round the equator, y from pole to pole), rotatable by pointer and keyboard. It SHALL say that the sphere's symmetry is the wrapping's, and SHALL keep a 2D fallback when 3D is unavailable.

#### Scenario: Same values, two shapes

- **WHEN** the reader switches from plane to sphere
- **THEN** the colours on the sphere are the plane's values rearranged, and the description says how many primes and which shape

### Requirement: Performance and limits

A figure SHALL redraw within about half a second at its largest count on a mid-range laptop and SHALL show that it is working when it takes longer; counts above a figure's limit SHALL be refused with the limit stated, never computed.

#### Scenario: Asking for too many

- **WHEN** a page asks RingField for 500,000 primes
- **THEN** the figure draws 100,000 and says that is its limit
