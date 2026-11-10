/** Validate author-owned JSON at build time, before publishing a partial diagram. */
export function parseFlowchart(text, source) {
  const fail = message => { throw new Error(`Invalid zen-flowchart in ${source}: ${message}`); };
  let value;
  try { value = JSON.parse(text); } catch { fail('expected JSON'); }
  const string = v => typeof v === 'string' && v.trim().length > 0;
  if (!value || !string(value.title) || !string(value.description)) fail('title and description are required');
  if (!Array.isArray(value.nodes) || !value.nodes.length || !Array.isArray(value.edges)) fail('nodes and edges must be arrays, with at least one node');
  const ids = new Set();
  for (const node of value.nodes) {
    if (!node || !string(node.id) || !/^[a-zA-Z0-9_-]+$/.test(node.id) || ids.has(node.id)) fail('node IDs must be unique identifiers');
    if (!string(node.label) || !Number.isFinite(node.x) || !Number.isFinite(node.y)) fail(`node ${node.id} needs a label and finite x/y`);
    if (node.detail !== undefined && !string(node.detail)) fail(`node ${node.id} detail must be text`);
    ids.add(node.id);
  }
  for (const edge of value.edges) {
    if (!edge || !ids.has(edge.from) || !ids.has(edge.to) || edge.from === edge.to || !string(edge.label)) fail('edges need known distinct endpoints and a label');
  }
  return value;
}
