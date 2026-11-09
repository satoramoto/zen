// Prime waves: the pictures from a short video about primes as waves, rebuilt and driven by the
// reader, with each pattern traced to where it comes from. Our own words throughout.
import { choice, cite, exercise, figure, formula, mark, note, paragraph, peek, ref, scrub, section, target, type Entry } from '../../model/document';

export const PRIME_WAVES: Entry = {
  id: 'prime-waves',
  title: 'Prime waves',
  kind: 'Chapter',
  standing: 'interpretation',
  path: ['Mathematics', 'Number theory'],
  summary:
    'A video draws the primes as waves and finds rings, spikes and symmetries. Here are the same pictures, live: move them and see which patterns come from the primes, which from simple fractions, and which from the screen.',
  quantities: {
    boundary: { value: 4, min: 1, max: 60, step: 1, label: 'Primes' },
    wrapped: { value: 8, min: 1, max: 60, step: 1, label: 'Primes' },
    marked: { value: 4, min: 2, max: 60, step: 1, label: 'Primes' },
    rings: { value: 20000, min: 1000, max: 100000, step: 1000, label: 'Primes' },
    resolution: { value: 384, min: 96, max: 768, step: 32, unit: 'px', label: 'Resolution' },
    gapCount: { value: 10000, min: 1000, max: 100000, step: 1000, label: 'Primes' },
    box: { value: 300, min: 10, max: 2000, step: 10, label: 'Primes' },
    shape: { value: 200, min: 10, max: 2000, step: 10, label: 'Primes' },
  },
  sections: [
    section(
      'A prime as a wave',
      paragraph(
        mark('interpretation'),
        'A short video makes a striking claim: that the primes, which look scattered almost at random, are really a field of waves, and that the waves only show their order when you look at them in more than one dimension. It illustrates the claim with a run of pictures. This chapter rebuilds each picture so you can move it, and asks of every pattern where it comes from.',
        cite('“FINALLY! The hidden patterns in PRIME NUMBERS show themselves – we were only looking in one dimension”, WTF.IsThisActuallyHappening?, YouTube, youtube.com/watch?v=Y9f-Gq42Pxg. The video does not give its code; the constructions here are ours.'),
      ),
      paragraph(
        mark('established'),
        'Start with one prime and a stretch of space between two walls, like a string fixed at both ends. Let the prime p decide a ',
        peek('standing-wave', 'standing wave'),
        ' that fits exactly p half-waves between the walls. Two fits two humps, three fits three, five fits five.',
      ),
      figure('boundary-waves', {}, { count: 'boundary' }),
      paragraph('Show the first ', scrub('boundary'), ' primes, one per row. Each row is a single prime; the walls are the same for all of them.'),
    ),
    section(
      'Many primes, and a circle',
      paragraph(
        mark('interpretation'),
        'The video then bends the stretch between the walls into a circle, so that each prime’s wave runs once round a ring and closes on itself. A few primes make a few wobbly loops; many make a woven band.',
      ),
      figure('wrapped-waves', {}, { count: 'wrapped' }),
      paragraph(
        'Wrap the first ',
        scrub('wrapped'),
        ' primes. Past sixty, the figure stops drawing separate curves and shades each spot by how many curves cross it: drag its own slider up to tens of thousands and the band becomes the grey disc from the video.',
      ),
      paragraph(
        mark('consequence'),
        'Nothing new is added by the wrapping: every curve is still one prime’s wave. What looks like order in the disc is the curves crowding where the ring is, and thinning where they swing in and out.',
      ),
    ),
    section(
      'Marks that never meet',
      paragraph(
        mark('established'),
        'Mark the still points of each wave, the places between its half-waves. Prime p has them at 1/p, 2/p and so on of the way across. The video says no two primes’ marks ever land in the same place, however many primes you add. That is true, and the reason is short.',
      ),
      figure('boundary-waves', { marks: true }, { count: 'marked' }),
      paragraph(
        'Mark the first ',
        scrub('marked'),
        ' primes. The figure finds the two marks of different primes that come closest and says how far apart they are.',
      ),
      formula(String.raw`\frac{k}{p} - \frac{j}{q} = \frac{kq - jp}{pq} \neq 0`, 'k over p minus j over q equals k q minus j p, over p q, which is never zero'),
      paragraph(
        mark('established'),
        'For two different primes p and q, the top of that fraction can never be zero: kq = jp would need p to divide k, and k is smaller than p. The closest it can get is 1, so the nearest two marks are 1/(pq) apart, and that happens for the two largest primes shown.',
      ),
      paragraph(
        mark('interpretation'),
        'So the marks never meet, but they do crowd ever closer: with ',
        ref('marked'),
        ' primes the nearest pair is already fine. Never meeting is a fact about fractions with prime bottoms, not a special property of waves.',
      ),
      target('closer-than-thousandth', ['Find the fewest primes (from 2) whose marks come closer than 1/1000 of the width, then check.'], {
        quantity: 'marked',
        expect: 12,
        tolerance: 0,
        hint: ['The nearest pair is 1/(pq) apart for the two largest primes shown. Which two neighbouring primes first multiply to more than 1000?'],
        solution: ['29 × 31 = 899 is not enough; 31 × 37 = 1147 is. The 12th prime is 37, so 12 primes.'],
      }),
      exercise('five-seven', ['How close do the marks of 5 and 7 come, as a share of the width? Give a decimal to three places.'], {
        check: 'numeric',
        expect: '0.029',
        tolerance: 0.001,
        placeholder: 'e.g. 0.123',
        hint: ['The nearest marks of p and q are 1/(pq) apart.'],
        solution: ['1/35 ≈ 0.029: for example 3/5 and 4/7 differ by 1/35.'],
      }),
    ),
    section(
      'Thousands of waves as rings',
      paragraph(
        mark('interpretation'),
        'The video’s best-known picture is a disc of rings, labelled with tens of thousands of prime waves. Here each prime is a wave running out from the centre, and the waves are added at every radius: light where they agree, dark where they cancel.',
      ),
      figure('ring-field', {}, { count: 'rings', resolution: 'resolution' }),
      paragraph(
        mark('established'),
        'At every whole-number radius all the waves are at a crest together, and at every half every prime but 2 is in a trough: ',
        peek('interference', 'interference'),
        ' builds rings exactly there. That is plain arithmetic: every prime but 2 is odd.',
      ),
      paragraph(
        'Draw ',
        scrub('rings'),
        ' primes at ',
        scrub('resolution'),
        '. Between the rings, thousands of waves cancel to flat grey. Now tick Average each pixel: more rings appear, at a third, a quarter, a sixth of the way between whole numbers.',
      ),
      paragraph(
        mark('established'),
        'Most of these waves are far finer than a pixel. A pixel that shows the field only at its centre catches each wave at an arbitrary point, and they cancel to grey; a pixel that averages over its width loses the fine waves altogether and keeps the slow waves of the smallest primes, 2, 3, 5 and 7, which line up at simple fractions. Either way, what you see depends on the pixel as much as on the primes: the screen is part of the picture, a cousin of ',
        peek('aliasing', 'aliasing'),
        '.',
      ),
      paragraph(
        mark('interpretation'),
        'The video’s rings are broader and its pictures show a cross and moiré near the centre. Our construction, the plainest one that makes rings from prime waves, does not make them, and the video does not give its own; so we cannot say what made them.',
        note('A cross and moiré in a picture of fine concentric rings is a classic sign of drawing them on a square grid of pixels.'),
      ),
      exercise('darkest-ring', ['Between radius 0 and radius 1, at what radius is the darkest ring?'], {
        check: 'numeric',
        expect: '0.5',
        tolerance: 0.01,
        placeholder: 'a radius',
        hint: ['Where is every odd prime’s wave in a trough at once? Try a radius that makes 2π·p·r an odd multiple of π.'],
        solution: ['At r = ½, every odd prime gives cos(π·p) = −1; only the prime 2 gives +1.'],
      }),
    ),
    section(
      'The gaps as a spectrum',
      paragraph(
        mark('interpretation'),
        'Next the video takes the ',
        peek('prime-gap', 'gaps'),
        ' between primes, turns each into a tone, and runs a ',
        peek('fourier-transform', 'Fourier transform'),
        '. The result is a spectrum full of sharp spikes, which the video presents as hidden frequencies.',
      ),
      figure('gap-spectrum', {}, { count: 'gapCount' }),
      paragraph(
        'Use the gaps of the first ',
        scrub('gapCount'),
        ' primes. Under the spectrum is the plain histogram of the same gaps: how often each gap size occurs.',
      ),
      paragraph(
        mark('established'),
        'Each spike sits at one gap size, and its height is how often that gap occurs: the spectrum is the histogram again, drawn as frequencies. The spikes are real, but they say what the histogram says: apart from the gap from 2 to 3, every gap is even, and gaps of 6 are the commonest.',
      ),
      paragraph(
        mark('established'),
        'Switch the signal to the prime indicator, a 1 at every prime and 0 elsewhere. Its spectrum peaks at ½, ⅓ and ⅙ of the sampling rate, because primes steer clear of multiples of 2 and 3.',
      ),
      choice('why-six', ['Why are gaps of 6 commoner than gaps of 2 or 4?'], {
        options: [
          { id: 'either', prompt: ['A gap of 6 can start from a prime of either kind (one more or one less than a multiple of 6); gaps of 2 or 4 can start from only one kind.'] },
          { id: 'random', prompt: ['Chance: with enough primes, any gap could come out on top.'] },
          { id: 'big', prompt: ['Larger gaps are always commoner than smaller ones.'] },
        ],
        expect: 'either',
        hint: ['After 3, every prime is one more or one less than a multiple of 6. Which gaps keep you on a number of that form?'],
        solution: [
          'From a prime one less than a multiple of 6, adding 2 lands on one more; from one more, adding 4 lands on one less. Adding 6 works from both, so it gets twice the chances.',
        ],
      }),
    ),
    section(
      'From one dimension to two and three',
      paragraph(
        mark('interpretation'),
        'The video then lets the waves spread across a surface. One natural way: give each prime a standing wave in a square that goes across and up at once, and add them all.',
      ),
      figure('box-field', {}, { count: 'box' }),
      paragraph(
        'Add the first ',
        scrub('box'),
        ' primes. The picture is symmetric left to right, top to bottom, and across the diagonal.',
      ),
      paragraph(
        mark('established'),
        'Each single wave already has all three symmetries, because the square has them. A sum of symmetric things is symmetric. So the symmetry is the square’s; the primes only decide the texture inside it, and the finest texture, again, changes with the resolution.',
      ),
      formula(String.raw`G(x, y) = \frac{1}{N}\sum_{p} \cos(2\pi p x)\,\cos(2\pi p y)`, 'G of x and y is the average over the primes of cos 2 pi p x times cos 2 pi p y'),
    ),
    section(
      'The flat plane and the sphere',
      paragraph(
        mark('interpretation'),
        'Finally the video lays the field on a flat plane, finds it lopsided, wraps it onto a sphere, and finds that it snaps into perfect symmetry.',
      ),
      figure('field-shape', {}, { count: 'shape' }),
      paragraph('Use ', scrub('shape'), ' primes, and switch between the plane and the sphere. The colours on the sphere are exactly the plane’s values, moved.'),
      paragraph(
        mark('established'),
        'Wrapping a square onto a sphere joins its left edge to its right and squeezes its top and bottom rows into single points. That wrapping has a lot of symmetry of its own, and the field takes it on. The sphere’s neatness is the wrapping’s, not a new fact about the primes.',
      ),
    ),
    section(
      'What the waves are said to mean',
      paragraph(
        mark('speculation'),
        'The video ends with bigger claims: that because prime waves never interfere, the information they carry always persists, so the primes could encode endless information, and that if the universe ran on code, a field like this would be its language.',
      ),
      paragraph(
        mark('speculation'),
        'These are ideas, not results. Nothing in the pictures tests them, and the pictures do not need them: the waves certainly do interfere (that is what makes the rings), and the marks never meeting is the fraction fact from earlier.',
      ),
      figure('boundary-waves', { marks: true, layout: 'overlaid' }, { count: 'marked' }),
      paragraph(
        mark('consequence'),
        'What the pictures do show is worth having: many of the patterns people see in primes are the arithmetic of small numbers (odd, not a multiple of 3), and some are the screen or the shape they are drawn on. Moving the picture is the quickest way to tell which is which. Set the primes to ',
        scrub('marked'),
        ' and watch the overlaid marks: never touching, always closer.',
      ),
    ),
  ],
};
