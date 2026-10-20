// Story fixtures, framework-free: what each story draws, as plain props, in a `<Name>.fixtures.ts`
// beside the component. The React stories and the Svelte stories both take their args from it, and
// the parity test (parity.test.tsx) renders every instance in both and compares the DOM.

/** The props that are data (not callbacks: each Storybook adds its own spies). */
type DataKeys<P> = { [K in keyof P]-?: NonNullable<P[K]> extends (...args: never[]) => unknown ? never : K }[keyof P];

/** One instance's props: the component's data props, a string `children` as its text. */
export type FixtureProps<P> = Partial<Pick<P, DataKeys<P>>> & { children?: string };

/** One story: its args, or several instances (each item drawn over the args, in a row). */
export interface StoryFixture<P> {
  args?: FixtureProps<P>;
  items?: FixtureProps<P>[];
}

/** A component's stories by export name (the same names in `<Name>.stories.tsx` and `<Name>.stories.svelte.ts`). */
export type Fixtures<P> = Record<string, StoryFixture<P>>;

/** Fixtures that keep their story names: `defineFixtures<ButtonModelProps>()({ Board: { args: … } })`. */
export const defineFixtures =
  <P>() =>
  <K extends string>(stories: Record<K, StoryFixture<P>>): Record<K, StoryFixture<P>> =>
    stories;

/** Every instance a story draws: its items over its args, or its args alone. */
export function instances<P>(fixture: StoryFixture<P>): FixtureProps<P>[] {
  return fixture.items ? fixture.items.map((item) => ({ ...fixture.args, ...item })) : [{ ...fixture.args } as FixtureProps<P>];
}
