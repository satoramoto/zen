# Spec Delta

## Purpose
The trigonometry figures: the ordinary furniture of a trigonometry classroom, each live, each driven by quantities a page can bind, each operable by hand and by keyboard.

## ADDED Requirements

### Requirement: Figures take their quantities as controlled props

Every trig figure SHALL take each of its quantities as a prop with a matching `on<Prop>` callback, keep its own state when a prop is not given, and draw with the contract's colour variables only (hues for the parts, text and border for the rest), so a page can bind the number in a sentence to the number in the drawing. Each SHALL be operable by pointer and by keyboard (arrow keys step the dragged thing), and SHALL have a story with a play that exercises it.

#### Scenario: A bound angle

- **WHEN** a page binds the unit circle's `angle` to the quantity `theta` and the reader drags the point
- **THEN** the page's `theta` changes and the scrub in the sentence shows the new angle

### Requirement: ArcWrap

ArcWrap SHALL draw a circle with its radius laid along the arc as a ruler: the reader sets the angle, and the figure shows how many radius-lengths the arc is, the angle in degrees and in radians (as a multiple of π when it is a neat one), and the radius unrolled beside the arc.

#### Scenario: One radian

- **WHEN** the angle is set so the arc equals the radius
- **THEN** the figure reads 1 rad and about 57.3°

### Requirement: RightTriangle

RightTriangle SHALL draw a right triangle with the reader dragging the free vertex (the angle and hypotenuse are the quantities), and SHALL show the three sides named opposite, adjacent and hypotenuse relative to the marked angle, with the three ratios live. It SHALL offer the 30-60-90 and 45-45-90 triangles as stops.

#### Scenario: The ratios hold under scaling

- **WHEN** the reader lengthens the hypotenuse without changing the angle
- **THEN** the three ratios do not change

### Requirement: UnitCircle

UnitCircle SHALL draw the unit circle with the point at the angle, its legs coloured as cosine and sine, the quadrant, the signs of the three functions, the reference angle, and the angle in degrees and radians. The reader SHALL drag the point around the circle or step it with the keyboard.

#### Scenario: Into the third quadrant

- **WHEN** the point is dragged to 210°
- **THEN** sine and cosine read negative, tangent positive, and the reference angle reads 30°

#### Scenario: Options

- **WHEN** the page asks for the tangent segment, snapping to the special angles, or a guide line at a value
- **THEN** the figure draws the segment on the line x = 1, lands the point on the nearest special angle, or draws the horizontal or vertical guide for solving sin θ = k by eye

### Requirement: WaveGraph

WaveGraph SHALL plot y = A·sin(B(x − C)) + D (or cosine, or tangent) over a range of x, with amplitude, period (or B), phase shift and midline as quantities, drawing the midline, the amplitude bracket and one period bracket, and MAY draw the generating circle beside it with the point and the trace joined. It SHALL have an inverse mode that draws the restricted domain and the inverse function, and a data mode that draws given points so a reader fits a curve to them.

#### Scenario: Halving the period

- **WHEN** the period is scrubbed from 2π to π
- **THEN** two full waves fit where one fit before and the period bracket halves

#### Scenario: Fitting tide data

- **WHEN** the figure is given six (hour, height) points and the reader sets amplitude, period, shift and midline
- **THEN** the curve passes within the figure's tolerance band of every point, and the figure says so

### Requirement: IdentitySquares and AngleSum

IdentitySquares SHALL draw the right triangle inside the unit circle with squares on its legs whose areas read sin²θ and cos²θ and always sum to one as the angle is dragged. AngleSum SHALL draw the two stacked right triangles whose sides read sin α cos β and cos α sin β, so sin(α + β) is seen as a sum of two lengths, with α and β as quantities.

#### Scenario: The squares always fill the unit square

- **WHEN** the angle is dragged anywhere
- **THEN** the two areas shown sum to 1.00

### Requirement: GeneralTriangle

GeneralTriangle SHALL draw a triangle with three draggable vertices and show its three sides and three angles, the law of sines' three ratios side by side (equal), and the law of cosines' terms for a chosen angle; it SHALL show the area as ½ab·sin C. It SHALL offer stops for the ambiguous case (two triangles from the same SSA data).

#### Scenario: The ratios agree

- **WHEN** any vertex is dragged
- **THEN** a/sin A, b/sin B and c/sin C read the same to two decimals
