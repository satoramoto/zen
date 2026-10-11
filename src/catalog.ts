export type BookId = "type" | "grid" | "color" | "ui" | "web" | "detail";
export type ExampleId =
  | "T1"
  | "T2"
  | "T3"
  | "G1"
  | "G2"
  | "G3"
  | "C1"
  | "C2"
  | "C3"
  | "R1"
  | "R2"
  | "R3"
  | "W1"
  | "W2"
  | "W3"
  | "B1"
  | "B2"
  | "B3";
export interface Reference {
  label: string;
  url: string;
}
export interface Book {
  id: BookId;
  title: string;
  author: string;
  subject: string;
  summary: string;
  reference: Reference;
  examples: ExampleId[];
  mark: string;
}
export const books: Book[] = [
  {
    id: "type",
    title: "Thinking with Type",
    author: "Ellen Lupton",
    subject: "Typography",
    summary:
      "Letters become text. Text becomes a page. A visual language of hierarchy, measure, and repetition helps the reader find a way through.",
    reference: {
      label: "Chronicle Books · publisher overview",
      url: "https://www.chroniclebooks.com/products/thinking-with-type-1",
    },
    examples: ["T1", "T2", "T3"],
    mark: "Aa",
  },
  {
    id: "grid",
    title: "Grid Systems in Graphic Design",
    author: "Josef Müller-Brockmann",
    subject: "Layout",
    summary:
      "The invisible structure beneath a clear composition: shared edges, content-led proportions, and deliberate intervals.",
    reference: {
      label: "Niggli · publisher overview",
      url: "https://niggli.ch/en/products/rastersysteme-fur-die-visuelle-gestaltung",
    },
    examples: ["G1", "G2", "G3"],
    mark: "▦",
  },
  {
    id: "color",
    title: "Interaction of Color",
    author: "Josef Albers",
    subject: "Color",
    summary:
      "Color is a relationship, not an isolated fact. Observe what happens when a fixed color meets a changing world around it.",
    reference: {
      label: "Albers Foundation · teaching account",
      url: "https://www.albersfoundation.org/alberses/teaching/interaction-of-color",
    },
    examples: ["C1", "C2", "C3"],
    mark: "◧",
  },
  {
    id: "ui",
    title: "Refactoring UI",
    author: "Adam Wathan & Steve Schoger",
    subject: "Interface styling",
    summary:
      "Small decisions can clarify an entire interface. Shape attention by controlling competition, limiting spacing values, and grouping related things.",
    reference: {
      label: "Official contents · hierarchy and spacing",
      url: "https://refactoringui.com/",
    },
    examples: ["R1", "R2", "R3"],
    mark: "≡",
  },
  {
    id: "web",
    title: "On Web Typography",
    author: "Jason Santa Maria",
    subject: "Type on screens",
    summary:
      "Type has a voice, and a screen never stays the same size. Choose expressive roles and let the composition adapt to where it is read.",
    reference: {
      label: "Author’s excerpt · How We Read",
      url: "https://alistapart.com/article/how-we-read/",
    },
    examples: ["W1", "W2", "W3"],
    mark: "Ag",
  },
  {
    id: "detail",
    title: "Butterick’s Practical Typography",
    author: "Matthew Butterick",
    subject: "The details",
    summary:
      "Make everyday reading comfortable, then refine the details. A little restraint and well-chosen punctuation let the words carry the meaning.",
    reference: {
      label: "Author’s online book",
      url: "https://practicaltypography.com/",
    },
    examples: ["B1", "B2", "B3"],
    mark: "“”",
  },
];
export interface Example {
  id: ExampleId;
  title: string;
  topic: string;
  axiom: string;
  control: string;
  note: string;
  defaultApplied: boolean;
  task: string;
  takeaway: string;
  reference?: Reference;
  extraReference?: Reference;
}
export const examples: Record<ExampleId, Example> = {
  T1: {
    id: "T1",
    topic: "Hierarchy",
    title: "Make the reading order visible",
    axiom:
      "Use distinct typographic roles for a title, introduction, and supporting information.",
    control: "Distinct type roles",
    note: "Brand, amount, and deadline sizes and weights change. All words, positions, line items, and payment options remain fixed.",
    task: "Find the amount you need to pay and its deadline before reading the line items. Which version brings those together first?",
    takeaway:
      "Studio-led gives the sender a strong identity. Payment-led makes the next obligation more prominent. Hierarchy depends on what the reader came to do.",
    defaultApplied: true,
  },
  T2: {
    id: "T2",
    topic: "Measure",
    title: "Give a paragraph its shape",
    axiom:
      "Line length works with size, spacing, and alignment to shape the reading experience.",
    control: "Maximum line width",
    note: "Only maximum line width changes, from 44 to 76 ch. The words, 16 px Georgia, and 155% leading stay fixed. The panel caps actual width; widen the window to see the full range.",
    task: "Read through the first paragraph, then find the next line after \u201cpublic life\u201d. Try a shorter and longer measure.",
    takeaway:
      "A shorter line makes return sweeps shorter but adds line breaks. A longer line uses less vertical space. Compare your reading comfort; no one width wins on every screen.",
    defaultApplied: true,
  },
  T3: {
    id: "T3",
    topic: "Repetition",
    title: "Repeat the rules, not the effort",
    axiom:
      "Give equivalent kinds of information recurring styles and alignments.",
    control: "Consistent type system",
    note: "Editorial cards use plausible format-specific title and metadata treatments. Recurring roles unify title size and put reading time in a consistent position; format names and thumbnails remain.",
    task: "You have ten minutes. Find the longest piece you can finish without opening a card.",
    takeaway:
      "Distinct treatments advertise an essay, interview, or photo story. A saved queue benefits from predictable metadata when comparing duration. Repetition need not erase content differences.",
    defaultApplied: true,
  },
  G1: {
    id: "G1",
    topic: "Alignment",
    title: "Give every row a shared edge",
    axiom:
      "Shared reference points connect separate elements into a coherent layout.",
    control: "Align schedule columns",
    note: "Inline times use their natural widths. Shared columns reserve the same time width for each row; content, row spacing, and type stay fixed.",
    task: "Find the room for the 10:15 session, then compare it with the session below.",
    takeaway:
      "Inline composition saves space for short times. Shared reference points let titles and rooms form an easy-to-follow column across variable-length times.",
    defaultApplied: true,
  },
  G2: {
    id: "G2",
    topic: "Proportion",
    title: "Let the content ask for space",
    axiom: "Choose grid proportions that serve the actual content.",
    control: "Give prose twice the space",
    note: "The columns change from 1:1 to 1.7:1. The same illustration scales to its column; all copy, font sizes, and gutter remain.",
    task: "Read what the exhibition is about, then decide whether its object image or its description deserves more space.",
    takeaway:
      "Equal columns make the object a co-star. Content-weighted columns give the longer explanation fewer short lines, at the cost of image presence. Choose the grid for the communication goal.",
    defaultApplied: true,
  },
  G3: {
    id: "G3",
    topic: "Rhythm",
    title: "Make equivalent rows feel related",
    axiom:
      "Consistent spacing helps equivalent elements read as a related set.",
    control: "Regular intervals",
    note: "A locally adjusted list uses 18 / 26 / 18 px intervals between equivalent rows. A regular list repeats 20 px. Row content, padding, type, and divider style stay fixed.",
    task: "Scan all four notification options. Which arrangement makes them feel like one recurring kind of decision?",
    takeaway:
      "Small local spacing decisions can suggest an unintended subgroup. Regular intervals make equivalent rows feel related. Use a larger interval deliberately when the meaning really changes.",
    defaultApplied: true,
  },
  C1: {
    id: "C1",
    topic: "Relativity",
    title: "One gray, two impressions",
    axiom: "A color can appear different when its surroundings change.",
    control: "Equalize the surrounds",
    note: "The centers are always #929292, equal in area and position. Both light and dark surrounds become the same neutral gray when revealed.",
    task: "Which central square seems lighter? Make a prediction, then remove both backgrounds.",
    takeaway:
      "A fixed gray often looks lighter against a darker surround. The reveal lets you check the equality directly. Strength of the effect varies with your display and perception.",
    defaultApplied: false,
  },
  C2: {
    id: "C2",
    topic: "Context",
    title: "Put the swatch to work",
    axiom: "Judge color within a composition, not only as an isolated swatch.",
    control: "Dark interface",
    note: "The two bars stay #D79B54, with identical dimensions and placement. Light and dark player surfaces and neutral text disappear together for the neutral reveal.",
    task: "Compare the two gold progress bars. Does one look brighter, richer, or more prominent? Now remove the players around them.",
    takeaway:
      "The useful design question is what an accent does in its actual setting. Equal color values do not guarantee equal apparent prominence. Neither theme is the correct one.",
    defaultApplied: false,
  },
  C3: {
    id: "C3",
    topic: "Comparison",
    title: "Change one relationship",
    axiom:
      "Learn through direct comparison while isolating one color relationship at a time.",
    control: "Surround hue",
    note: "Only the two surround hues rotate, 180\u00b0 apart. Their HSL saturation stays 42% and lightness 62%; both targets stay #9892A6. Reveal uses one common neutral surround.",
    task: "Does either violet square seem warmer or cooler? Rotate the surroundings, then remove them to check the match.",
    takeaway:
      "A color can pick up a different apparent cast in different relationships. Equal HSL lightness is not equal perceived brightness, so this is an exploratory comparison, not a pure hue-only perceptual measurement.",
    defaultApplied: false,
  },
  R1: {
    id: "R1",
    topic: "Emphasis",
    title: "Quiet the competition",
    axiom: "Emphasize a focal element by de-emphasizing competing text.",
    control: "Quiet supporting details",
    note: "Secondary heading, labels, and details become lower-contrast. The check-in block, sizes, weights, positions, and all wording remain unchanged.",
    task: "You are arriving today. Find the check-in time without reading every detail of the reservation.",
    takeaway:
      "Quiet context helps the next useful information stand out without making it bigger. Even contrast gives the reservation details more equal attention; hierarchy should follow the current task.",
    defaultApplied: true,
  },
  R2: {
    id: "R2",
    topic: "Scales",
    title: "Build a spacing vocabulary",
    axiom: "Constrain recurring values into a small, consistent scale.",
    control: "Use an 8 / 16 px scale",
    note: "Locally chosen row padding and inner gaps become a shared 4 / 8 / 12 / 16 px spacing vocabulary. Content, type, colors, and overall panel width remain fixed.",
    task: "Compare the icon-to-title and row-to-row rhythm as you scan for Homepage.fig.",
    takeaway:
      "Locally tailored spacing can serve individual rows. Here the rows do the same job: repeating a small spacing vocabulary gives them a coherent rhythm. Tokens support decisions; they do not make every distance identical.",
    defaultApplied: true,
  },
  R3: {
    id: "R3",
    topic: "Proximity",
    title: "Let space do the grouping",
    axiom:
      "Place supporting text closer to the control it explains than to neighboring controls.",
    control: "Group labels and fields",
    note: "The first help sentence is equally spaced between its neighboring options in Shared interval. Clear ownership brings each help sentence closer to its own option and farther from the next. Content and typography remain fixed.",
    task: "Which notification is sent only for an unfamiliar device: sign-in emails or the weekly summary?",
    takeaway:
      "A sentence can look like a footnote for the option above or an introduction to the one below. Relative distance gives it an owner without adding a box or another label.",
    defaultApplied: true,
  },
  W1: {
    id: "W1",
    topic: "Voice",
    title: "Listen to the letterforms",
    axiom:
      "Choose type with attention to the content and the voice it conveys.",
    control: "Headline family",
    note: "Only the exhibition title family changes. Title size, weight, words, layout, and the original sculptural illustration stay fixed; differing font metrics can change line width.",
    task: "Imagine this poster belongs to a literary museum, a city collection, or a design archive. Which voice would you choose, and why?",
    takeaway:
      "Georgia, system sans, and monospace suggest different associations in this setting. Voice is contextual and subjective; the experiment offers a choice, not a ranking.",
    defaultApplied: true,
    reference: {
      label: "Book overview · choosing type",
      url: "https://abookapart.com/products/on-web-typography.html",
    },
  },
  W2: {
    id: "W2",
    topic: "Pairing",
    title: "Give typefaces different jobs",
    axiom:
      "Use compatibility and contrast to create complementary typographic roles.",
    control: "Sans-serif navigation",
    note: "Only the navigation font family changes between Georgia and system sans. Its size, weight, tracking, position, and text stay fixed; the article remains Georgia.",
    task: "Locate the navigation, then read the opening. Does the change of voice help separate the two jobs?",
    takeaway:
      "A single family ties the page together. A complementary sans voice can distinguish navigation from editorial content. Contrast works when the roles are clear, not simply because there are two fonts.",
    defaultApplied: true,
    reference: {
      label: "Book overview · pairing type",
      url: "https://abookapart.com/products/on-web-typography.html",
    },
  },
  W3: {
    id: "W3",
    topic: "Adaptation",
    title: "A page that finds its fit",
    axiom:
      "Adapt typographic size, measure, and spacing to changing screen conditions.",
    control: "Requested preview width",
    note: "Both policies share 16 px body text and the same words. Fixed keeps a 36 px heading and 28 px padding; Adaptive scales the heading and padding with the container. Requested width is capped by available space.",
    task: "Set a narrow width and compare the two policies. How soon can you start reading the story? Then widen the panel.",
    takeaway:
      "The fixed composition is comfortable with room to spare. At narrower widths, adaptation preserves more reading space and reduces heading bulk. It changes the rhythm; it is not permission to shrink body text.",
    defaultApplied: true,
  },
  B1: {
    id: "B1",
    topic: "Body text",
    title: "Give each line room to breathe",
    axiom:
      "Prioritize body text conditions: font, size, line spacing, and measure.",
    control: "Reading density",
    note: "Only leading changes: 135% or 155%. The same 16 px Georgia, maximum 62 ch measure, paragraphs, and margins remain fixed.",
    task: "Read the paragraph in both settings. Notice how readily your eye returns to the next line and how much page space the text uses.",
    takeaway:
      "Both settings are readable, plausible choices. More leading separates the lines; compact leading keeps a long page shorter. Judge the relationship between line length, font, and density.",
    defaultApplied: true,
    reference: {
      label: "Body text · typography in ten minutes",
      url: "https://practicaltypography.com/typography-in-ten-minutes.html",
    },
  },
  B2: {
    id: "B2",
    topic: "Restraint",
    title: "Save emphasis for the essential",
    axiom: "Use emphasis sparingly so important words can stand out.",
    control: "Selective emphasis",
    note: "Several highlights bold the check-in time, booking details, and parking as well as the action. Action highlight removes only those optional weights; the arrival-time request stays bold.",
    task: "You are skimming amenities; then imagine you need to know what to do before arrival. Does the same emphasis serve both tasks?",
    takeaway:
      "The broader emphasis supports policy scanning. Selective emphasis makes the one required response easier to pick out. Restraint is useful when you have decided what deserves attention.",
    defaultApplied: true,
    reference: {
      label: "Author’s chapter · bold or italic",
      url: "https://practicaltypography.com/bold-or-italic.html",
    },
  },
  B3: {
    id: "B3",
    topic: "Punctuation",
    title: "Make the small marks count",
    axiom: "Use quotation marks, apostrophes, and dashes suited to their jobs.",
    control: "Typographic punctuation",
    note: "CMS defaults use common straight quotes and hyphens. Editorial marks use curly quotes, an apostrophe, an em dash, and an en dash. Words, type, layout, and the compound hyphen in well-loved stay fixed.",
    task: "Read the invitation, then inspect the enlarged marks. Which marks signal quotation, interruption, and a time range?",
    takeaway:
      "These are small editorial distinctions, not a cure for a weak layout. Different marks have different jobs; keep the compound hyphen even when refining the range and sentence break.",
    defaultApplied: true,
    reference: {
      label: "Author’s chapter · quotation marks",
      url: "https://practicaltypography.com/straight-and-curly-quotes.html",
    },
    extraReference: {
      label: "Author’s chapter · hyphens and dashes",
      url: "https://practicaltypography.com/hyphens-and-dashes.html",
    },
  },
};
export function bookFor(id: ExampleId): Book {
  return books.find((book) => book.examples.includes(id))!;
}
export function descriptionFor(id: ExampleId): string {
  const e = examples[id];
  const ref = e.reference ?? bookFor(id).reference;
  return `${e.axiom}\n\nTask: ${e.task}\n\n${e.note}\n\n${e.takeaway}\n\nOriginal teaching illustration; paraphrased principle, not a quotation. Reference: [${ref.label}](${ref.url}).`;
}
