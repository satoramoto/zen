import documentation, { FindAConcept } from '../../components/Documentation/Documentation.stories';

// Deliberately failing integration fixture: the exact same play with no search results.
// It inherits the runtime walkthrough but declares no new scenario/manual task.
export default { ...documentation, title: 'Site/Screens/ManualFailure' };
export const MissingMatch = { ...FindAConcept, args: { ...documentation.args, pages: [] } };
