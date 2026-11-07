// A short interactive textbook on Fourier series, told the way the rotating-arrow picture tells
// it: drawings as sums of turning arrows, with heat on a rod as the reason anyone asked. Every
// idea has a figure the reader drives, and the text's numbers are the figure's numbers.
import { cite, exercise, figure, formula, mark, note, paragraph, peek, ref, scrub, section, steps, tex, type Entry, type EntryHead } from '../../model/document';

export const FOURIER_GLOSSARY: Record<string, EntryHead> = {
  linear: {
    title: 'Linear equation',
    kind: 'Concept',
    standing: 'established',
    summary: 'An equation whose solutions add: if two things solve it, so does their sum, and so does any multiple of either. The heat equation is one.',
  },
  'complex-exponential': {
    title: 'Complex exponential',
    kind: 'Concept',
    standing: 'established',
    summary: 'e raised to an imaginary number: e^(iθ) is the point on the unit circle at angle θ, so e^(it) walks round the circle as t grows.',
  },
  average: {
    title: 'Average of a function',
    kind: 'Concept',
    standing: 'established',
    summary: 'Sample the function at evenly spaced inputs and average the outputs; as the samples get finer this settles to the integral over the range, divided by the range’s length.',
  },
  limit: {
    title: 'Infinite sum',
    kind: 'Concept',
    standing: 'established',
    summary: 'Not a sum anyone finishes: the partial sums get as close as you like to one value, and stay there. That value is what the infinite sum “equals”.',
  },
};

export const DRAWING: Entry = {
  id: 'drawing-with-circles',
  title: 'Drawing with circles',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Fourier series'],
  summary: 'Arrows joined tip to tail, each turning at its own steady rate, together draw a shape. Set their starting sizes and angles right and they draw any shape you like.',
  quantities: { arrows: { value: 21, min: 1, max: 101, step: 2, label: 'Arrows' } },
  sections: [
    section(
      'The swarm',
      paragraph(
        mark('established'),
        'Each arrow in the figure does the simplest thing an arrow can do: it turns at a steady rate, a whole number of times per cycle. The first turns once, the next once the other way, then twice, twice the other way, and so on. Joined tip to tail, their last tip wanders, and its wandering draws a shape.',
      ),
      paragraph(
        'Try it with ',
        scrub('arrows'),
        ' arrows. Press Play and watch the last tip; drag the number down to a handful and the drawing goes blobby, drag it up and the little quick arrows fill in the corners. Change the drawing to the square or the star.',
      ),
      figure('epicycles', { number: 'Figure 1' }, { arrows: 'arrows' }),
      paragraph(
        mark('interpretation'),
        'What is striking is the mismatch. Every arrow is clockwork. The sum is anything but, and yet the swarm cooperates to trace one specific shape. Nothing in the figure is random, and nothing is tuned while it runs: the only choices are each arrow’s starting size and angle. Those choices are the whole story of this book.',
      ),
    ),
    section(
      'What the arrows are',
      paragraph(
        mark('established'),
        'Count the arrows: one that never turns, then pairs, one of each pair turning anticlockwise and the other clockwise. With ',
        ref('arrows'),
        ' arrows there are ',
        ref('arrows', '({} − 1) ÷ 2'),
        ' pairs. The still arrow sets where the drawing sits; each pair adds one more wiggle per cycle.',
      ),
      paragraph(
        'Written out, the drawing at time ',
        tex('t'),
        ' (from 0 to 1, one cycle) is a sum of terms, one per arrow:',
      ),
      formula(String.raw`f(t) = \sum_{n=-N}^{N} c_n \, e^{\,n \cdot 2\pi i \, t}`, 'f of t equals the sum from n equals minus N to N of c sub n times e to the n times 2 pi i t'),
      paragraph(
        'The factor ',
        tex(String.raw`e^{\,n \cdot 2\pi i \, t}`),
        ' is an arrow of length 1 turning ',
        tex('n'),
        ' times per cycle; ',
        tex('c_n'),
        ' is the number that sets its starting size and angle. The next chapters take this formula apart one piece at a time, and the last one shows how to find every ',
        tex('c_n'),
        ' from the drawing itself.',
        note('Sine-and-cosine Fourier series, the ones in most textbooks, are a special case: see the chapter on flat drawings.'),
      ),
      exercise('pairs', ['With 41 arrows, how many pairs turn in opposite directions?'], {
        check: 'numeric',
        expect: '20',
        placeholder: 'a whole number',
        hint: ['One arrow stays still; the rest come in pairs.'],
        solution: ['41 arrows are the still one and (41 − 1) ÷ 2 = 20 pairs.'],
      }),
    ),
  ],
};

export const HEAT: Entry = {
  id: 'heat',
  title: 'Where it came from: heat',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Fourier series'],
  summary: 'Fourier was not drawing. He was asking how heat spreads along a rod, and found that cosine waves are the shapes that cool simply: each keeps its shape and only shrinks.',
  quantities: { time: { value: 0, min: 0, max: 0.25, step: 0.005, label: 'Time' } },
  sections: [
    section(
      'Waves that only shrink',
      paragraph(
        mark('established'),
        'The heat equation says how a temperature profile along a rod changes from moment to moment. For most starting profiles it is hard to say what happens next. But if the profile is a cosine wave with a whole number of half-waves along the rod, so it is flat at both ends, the answer is easy: the wave keeps its shape and its height decays exponentially. The more wiggles, the faster the decay: mode ',
        tex('n'),
        ' decays at a rate proportional to ',
        tex('n^2'),
        '.',
      ),
      figure('heat-modes', { number: 'Figure 2' }, { time: 'time' }),
      paragraph(
        'Set the time to ',
        scrub('time'),
        ' and watch the thin curves, one per mode: the wiggly ones are gone almost at once, mode 1 lingers, and mode 0, the flat one, never changes. The thick curve is their sum.',
      ),
    ),
    section(
      'Adding solutions',
      paragraph(
        mark('established'),
        'The heat equation is ',
        peek('linear', 'linear'),
        ': add two solutions and the sum is a solution; scale one and it still is. So a profile built by adding a few cosine modes, each with its own height, is solved for free. Each mode shrinks at its own rate, and the sum does whatever that adds up to.',
      ),
      paragraph(
        mark('consequence'),
        'That is why a profile smooths out over time. The high modes carry the sharp detail, and they die first, by the square of their frequency. Everything the heat equation says about such a profile is in that one list of decay rates.',
      ),
      paragraph(
        mark('interpretation'),
        'Here the sensible thing to say would have been: fine, we can solve it for profiles that happen to be sums of cosines, but real profiles are not like that. Fourier’s move was to refuse that. He asked whether every profile, even a rude one, is a sum of cosines. The next chapter is his first answer.',
        cite('J. Fourier, Théorie analytique de la chaleur (1822), on the heat equation and trigonometric series.'),
      ),
      exercise('rates', ['Mode 3 decays how many times faster than mode 1?'], {
        check: 'numeric',
        expect: '9',
        placeholder: 'a whole number',
        hint: ['The rate goes with the square of the mode number.'],
        solution: ['The rates are (nπ)², so mode 3 is 3² = 9 times faster than mode 1.'],
      }),
    ),
  ],
};

export const STEP: Entry = {
  id: 'step',
  title: 'A step made of waves',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Fourier series'],
  summary: 'Two rods, one hot and one cold, pressed together: the starting profile is a step, as unlike a wave as a shape can be. It is still a sum of cosines, if you are allowed infinitely many.',
  quantities: {
    terms: { value: 3, min: 1, max: 60, step: 1, label: 'Cosines' },
    probe: { value: 0.25, min: 0, max: 1, step: 0.05, label: 'Probe' },
  },
  sections: [
    section(
      'The step',
      paragraph(
        mark('established'),
        'Take the rod to have length 1, the left half at temperature 1 and the right half at −1. The profile is flat, then jumps, then flat again. Nothing wavy about it, and it is not even continuous. Fourier’s claim is that it equals this sum of cosines, where only the odd frequencies appear and the coefficients shrink like 1, ⅓, ⅕, ⅐, …:',
      ),
      formula(
        String.raw`\frac{4}{\pi}\left(\cos \pi x - \frac{1}{3}\cos 3\pi x + \frac{1}{5}\cos 5\pi x - \frac{1}{7}\cos 7\pi x + \cdots\right)`,
        'four over pi times the quantity cosine pi x minus one third cosine 3 pi x plus one fifth cosine 5 pi x minus one seventh cosine 7 pi x and so on',
      ),
      paragraph(
        'Add the first ',
        scrub('terms'),
        ' of them and look at the thick curve. A few cosines make a rounded wave; a few dozen make something that is flat nearly everywhere and steep at the middle, with a little overshoot beside the jump that narrows but never goes away.',
      ),
      figure('step-series', { number: 'Figure 3' }, { terms: 'terms', probe: 'probe' }),
    ),
    section(
      'What an infinite sum means',
      paragraph(
        mark('established'),
        'No finite sum of cosines is flat, and none jumps. The claim is about the ',
        peek('limit', 'infinite sum'),
        '. Put the probe at ',
        scrub('probe'),
        ' and read the list under the figure: it is the sequence of partial sums at that one point. Left of the middle they close in on 1; right of it, on −1. They never arrive, but they get as close as you like and stay.',
      ),
      steps(
        'The same idea with plain numbers',
        ['The sum ', tex(String.raw`1 - \tfrac13 + \tfrac15 - \tfrac17 + \cdots`), ' is never finished, and every partial sum is a fraction.'],
        ['Its partial sums close in on ', tex(String.raw`\pi/4`), ', which is not a fraction at all: after a thousand terms they are within a thousandth of it.'],
        ['So we say the infinite sum equals ', tex(String.raw`\pi/4`), '. A limit can be something no finite stage is. The same goes for functions: wavy, continuous pieces can have a flat, broken limit.'],
      ),
      paragraph(
        mark('consequence'),
        'At the jump itself, ',
        tex('x = 0.5'),
        ', every odd cosine is zero, so every partial sum is zero and the limit is zero: the series insists the step takes the value halfway up its own jump. Set the probe exactly there and see the list hold at 0.',
        note('Which functions have such a series, and whether the limit really solves the heat equation, are the questions real analysis was built to settle.'),
      ),
      exercise('fifth', ['What coefficient multiplies cos(5πx) in the step’s series? Give it to three decimal places.'], {
        check: 'numeric',
        expect: '0.2546',
        tolerance: 0.001,
        placeholder: '0.…',
        hint: ['It is 4/π times 1/5.'],
        solution: ['4 ÷ (5π) ≈ 0.2546.'],
      }),
      exercise('at-jump', ['What value does the series give at x = 0.5, the jump?'], {
        check: 'numeric',
        expect: '0',
        placeholder: 'a number',
        hint: ['What is cos(kπ/2) for odd k?'],
        solution: ['Every term is cos(odd × π/2) = 0, so the sum is 0: halfway up the jump.'],
      }),
    ),
  ],
};

export const ARROW: Entry = {
  id: 'one-arrow',
  title: 'One arrow',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Fourier series'],
  summary: 'The building block of the general series is a single turning arrow, written with a complex exponential. A coefficient sets where it starts and how long it is; a whole number sets how fast it turns.',
  quantities: {
    n: { value: 1, min: -5, max: 5, step: 1, label: 'Turns per cycle' },
    size: { value: 1, min: 0, max: 1.5, step: 0.05, label: 'Size' },
    angle: { value: 0, min: -180, max: 180, step: 5, unit: '°', label: 'Starting angle' },
  },
  sections: [
    section(
      'Drawings in the plane',
      paragraph(
        mark('established'),
        'From here on, the function being taken apart is a drawing: as ',
        tex('t'),
        ' runs from 0 to 1 a pencil tip moves about the plane, and we treat the plane as the complex numbers. A temperature profile is a drawing too, a dull one that never leaves the real line. Working in the plane makes the arithmetic cleaner and the reasons clearer, which is why the general picture is worth the detour.',
      ),
      paragraph(
        'The engine of the whole thing is the ',
        peek('complex-exponential', 'complex exponential'),
        '. As ',
        tex('t'),
        ' grows, ',
        tex(String.raw`e^{it}`),
        ' walks round the unit circle at one radian per unit of time. Put ',
        tex(String.raw`2\pi`),
        ' in the exponent and it makes exactly one full turn as ',
        tex('t'),
        ' goes from 0 to 1; put ',
        tex(String.raw`n \cdot 2\pi`),
        ' and it makes ',
        tex('n'),
        ' turns, clockwise when ',
        tex('n'),
        ' is negative, and when ',
        tex('n = 0'),
        ' it stays put at 1.',
      ),
      formula(String.raw`e^{\,n \cdot 2\pi i \, t}, \qquad n = 0, \pm 1, \pm 2, \ldots`, 'e to the n times 2 pi i t, for n equal to 0, plus or minus 1, plus or minus 2, and so on'),
    ),
    section(
      'The coefficient',
      paragraph(
        mark('established'),
        'Each arrow begins pointing at 1, length 1. Multiplying it by a complex number ',
        tex('c_n'),
        ' turns it to a new starting angle and stretches it to a new length, and that is all a coefficient ever does. In the figure the arrow turns ',
        scrub('n'),
        ' times per cycle, its size is ',
        scrub('size'),
        ' and it starts at ',
        scrub('angle'),
        '. Everything about its motion is fixed by those three numbers.',
      ),
      figure('rotating-vector', { number: 'Figure 4' }, { turns: 'n', size: 'size', angle: 'angle' }),
      paragraph(
        mark('consequence'),
        'A coefficient of 0.5 on the still arrow (',
        tex('n = 0'),
        ') parks it at 0.5. A coefficient of ',
        tex(String.raw`0.3\,e^{i\pi/4}`),
        ' on the once-a-cycle arrow starts it at 45° with length 0.3. The series is nothing but a list of such coefficients, one per whole number ',
        tex('n'),
        '.',
      ),
      exercise('turns', ['As t goes from 0 to 1, how many full turns does e^(3·2πi·t) make?'], {
        check: 'numeric',
        expect: '3',
        placeholder: 'a whole number',
        solution: ['The exponent reaches 3 · 2π, three full turns.'],
      }),
      exercise('start', ['An arrow has coefficient 0.5 · e^(iπ/2). At what angle, in degrees, does it start?'], {
        check: 'numeric',
        expect: '90',
        placeholder: 'degrees',
        hint: ['π/2 radians.'],
        solution: ['e^(iπ/2) points straight up: 90°. The 0.5 only sets its length.'],
      }),
    ),
  ],
};

export const FLAT: Entry = {
  id: 'flat-drawings',
  title: 'Flat drawings',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Fourier series'],
  summary: 'A real-valued function is a drawing that never leaves the real line. Its arrows come in mirrored pairs, and each pair, turning opposite ways, adds up to one cosine wave.',
  quantities: { pair: { value: 1, min: 1, max: 6, step: 1, label: 'Frequency' } },
  sections: [
    section(
      'Pairs that cancel sideways',
      paragraph(
        mark('established'),
        'Take the arrow turning ',
        tex('n'),
        ' times anticlockwise and the one turning ',
        tex('n'),
        ' times clockwise, give them the same length, and start them at mirror-image angles. Whatever height one has above the real line, the other has below it, so their sum never leaves the line. Along the line it swings back and forth: a cosine, ',
        tex('n'),
        ' cycles per turn of the clock.',
      ),
      paragraph('Set the pair’s frequency to ', scrub('pair'), ' and press Play. The dot on the left is the sum, sliding along the real line; the graph on the right is the same dot with time laid out sideways, the picture of a wave you are used to.'),
      figure('pair-to-sine', { number: 'Figure 5' }, { frequency: 'pair' }),
    ),
    section(
      'Why the textbook series has sines and cosines',
      paragraph(
        mark('consequence'),
        'A function with real values is a flat drawing, so its arrows must pair up this way: ',
        tex('c_{-n}'),
        ' is the mirror image of ',
        tex('c_n'),
        '. Pair by pair the series becomes a sum of cosines with shifts, which is to say sines and cosines. The step of the last chapter is exactly this: its arrows for ',
        tex(String.raw`\pm 1, \pm 3, \pm 5, \ldots`),
        ' pair into the odd cosines, and its even arrows are all zero.',
        note('Starting the pair at an angle shifts the cosine along; a shift of 90° makes it a sine.'),
      ),
      paragraph(
        mark('interpretation'),
        'So the familiar Fourier series is the general one seen edge-on. Keeping the plane in view costs one idea, the complex exponential, and buys a single formula for every coefficient. That formula is the last chapter.',
      ),
      exercise('cycles', ['The pair of arrows turning ±4 times per cycle adds up to a cosine with how many cycles per turn of the clock?'], {
        check: 'numeric',
        expect: '4',
        placeholder: 'a whole number',
        solution: ['Each arrow turns 4 times; their sum swings 4 times: cos(4 · 2πt).'],
      }),
    ),
  ],
};

export const FINDING: Entry = {
  id: 'finding-coefficients',
  title: 'Finding every coefficient',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Fourier series'],
  summary: 'The centre of a drawing is its average point, and that is the still arrow’s coefficient. To find any other, spin the drawing back so that arrow holds still, then take the average again.',
  quantities: { which: { value: 0, min: -5, max: 5, step: 1, label: 'Which arrow' } },
  sections: [
    section(
      'The still arrow is the average',
      paragraph(
        mark('established'),
        'Sample the drawing at many evenly spaced times and ',
        peek('average', 'average'),
        ' the points. Finer and finer sampling settles on one point, the integral of ',
        tex('f'),
        ' over the cycle, and since the cycle has length 1 the integral is the average. That point is the centre of mass of the drawing, and it is ',
        tex('c_0'),
        '.',
      ),
      steps(
        'Why the average is c₀',
        ['The drawing is a sum of arrows, so its average is the sum of the arrows’ averages: averaging is linear.'],
        ['An arrow that turns a whole number of times in the cycle sweeps evenly round a circle, so its average over the cycle is its centre: zero.'],
        ['The one arrow that does not turn has average ', tex('c_0'), ', wherever it was parked. Everything else averages away, and ', tex('c_0'), ' is what remains.'],
      ),
    ),
    section(
      'Hold one arrow still',
      paragraph(
        mark('established'),
        'To find ',
        tex('c_2'),
        ', first multiply the whole drawing by ',
        tex(String.raw`e^{-2 \cdot 2\pi i \, t}`),
        '. Multiplying exponentials adds exponents, so every arrow’s turn count drops by 2: the arrow that turned twice now holds still, the still one now turns twice the other way, and every other arrow still makes some whole number of turns. Now take the average. Everything that turns averages to zero, and what remains is ',
        tex('c_2'),
        '.',
      ),
      paragraph(
        'Pick which arrow to find: ',
        scrub('which'),
        '. The left pane is the drawing with its average point, ',
        tex('c_0'),
        '. The right pane is the drawing spun back by that many turns; its average point is the coefficient you asked for. Change the drawing and watch the averages move.',
      ),
      figure('coefficient-finder', { number: 'Figure 6' }, { turns: 'which' }),
      paragraph(mark('consequence'), 'There is nothing special about 2. For any whole number ', tex('n'), ':'),
      formula(String.raw`c_n = \int_0^1 f(t)\, e^{-n \cdot 2\pi i \, t}\, dt`, 'c sub n equals the integral from 0 to 1 of f of t times e to the minus n times 2 pi i t, d t'),
      paragraph(
        mark('interpretation'),
        'Read it as two moves: spin the drawing back so that arrow holds still, then average to kill everything that still moves. All the intricacy of the swarm in the first chapter is produced by this one line, computed once per arrow.',
        note('In practice the integral is a sum: chop the cycle into small pieces of width Δt and add f(t)·e^(−n·2πi·t)·Δt over them. Finer pieces, better coefficients.'),
      ),
      exercise('centre', ['A drawing is a circle of radius 1 whose centre is the point 2 on the real line. What is c₀?'], {
        check: 'numeric',
        expect: '2',
        placeholder: 'a number',
        hint: ['c₀ is the average point of the drawing.'],
        solution: ['The circle’s points average to its centre, 2.'],
      }),
      exercise('shift', ['You multiply a drawing by e^(−3·2πi·t). The arrow that used to turn 5 times now turns how many times?'], {
        check: 'numeric',
        expect: '2',
        placeholder: 'a whole number',
        hint: ['Exponents add.'],
        solution: ['5 − 3 = 2 turns.'],
      }),
      exercise('samples', ['Computing the integral numerically with pieces of width Δt = 0.001, how many samples of the drawing are added?'], {
        check: 'numeric',
        expect: '1000',
        placeholder: 'a whole number',
        solution: ['The cycle has length 1; 1 ÷ 0.001 = 1000 pieces.'],
      }),
    ),
  ],
};

export const BACK: Entry = {
  id: 'the-step-drawn',
  title: 'The step, drawn',
  kind: 'Chapter',
  standing: 'established',
  path: ['Mathematics', 'Fourier series'],
  summary: 'Back to the two rods. As a drawing the step is a dot that sits at 1 for half the cycle and at −1 for the other half; its arrows pair into the odd cosines, and its coefficients come from the same integral.',
  quantities: { arrows: { value: 31, min: 1, max: 101, step: 2, label: 'Arrows' } },
  sections: [
    section(
      'A dull drawing',
      paragraph(
        mark('established'),
        'Choose the step as the drawing. The pencil never leaves the real line: it rests near 1, then crosses to −1 and rests there. With ',
        scrub('arrows'),
        ' arrows the sum of arrows does the same, hovering near each level and dashing across the gap. Each pair of opposite arrows is one of the cosines of the third chapter, and the arrows turning an even number of times have coefficient zero.',
      ),
      figure('epicycles', { number: 'Figure 7', path: 'step' }, { arrows: 'arrows' }),
      paragraph(
        mark('consequence'),
        'For this drawing the integral can be done by hand: ',
        tex(String.raw`c_n = \int_0^{1/2} e^{-n 2\pi i t}\,dt - \int_{1/2}^{1} e^{-n 2\pi i t}\,dt`),
        ', which comes out to zero for even ',
        tex('n'),
        ' and to ',
        tex(String.raw`\tfrac{2}{n \pi i}`),
        ' for odd ',
        tex('n'),
        '. Pairing ',
        tex('n'),
        ' with ',
        tex('-n'),
        ' gives back the cosine coefficients ',
        tex(String.raw`\tfrac{4}{\pi}, -\tfrac{4}{3\pi}, \tfrac{4}{5\pi}, \ldots`),
        ' with their alternating signs.',
      ),
    ),
    section(
      'Where this goes',
      paragraph(
        mark('interpretation'),
        'Taking a function apart into exponentials and putting the pieces through a ',
        peek('linear', 'linear'),
        ' equation one at a time is a move that returns again and again in differential equations, and the complex exponential is the piece that makes it work. The heat on two rods was one window onto it; the rotating arrows are the same view with the frame widened.',
      ),
      exercise('odd', ['For the step drawing, what is the coefficient c₂?'], {
        check: 'numeric',
        expect: '0',
        placeholder: 'a number',
        hint: ['Only odd arrows appear.'],
        solution: ['Even arrows have coefficient 0; only odd ones carry the step.'],
      }),
    ),
  ],
};
