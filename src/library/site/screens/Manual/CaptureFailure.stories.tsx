import documentation, { FindAConcept } from '../../components/Documentation/Documentation.stories';

// Deliberately failing integration fixture: the exact same play with no search results.
// It inherits the runtime walkthrough but declares no new scenario/manual task.
// Played by scripts/check-manual.mjs, which expects it to fail: not a test to Storybook's runners.
export default { ...documentation, title: 'Site/Screens/ManualFailure', tags: ['!test'] };
export const MissingMatch = { ...FindAConcept, args: { ...documentation.args, pages: [] } };
