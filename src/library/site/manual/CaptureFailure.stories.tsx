import documentation, { FindAConcept } from '../Documentation.stories';

// Deliberately failing integration fixture: the exact same play with no search results.
// It inherits the runtime walkthrough but declares no new scenario/manual task.
export default { ...documentation, title: 'Site/ManualFailure' };
export const MissingMatch = { ...FindAConcept, args: { ...documentation.args, pages: [] } };
