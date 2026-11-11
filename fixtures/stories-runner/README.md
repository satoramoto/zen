# Fixture for the story runner

A small Storybook that `src/harness/stories/stories.test.ts` plays with `zen-stories`: stories
that pass, a play that throws, stories tagged `browser` and `stage`, and one that only breaks in
a real browser. It is not part of zen's own Storybook and some of its stories fail on purpose.
