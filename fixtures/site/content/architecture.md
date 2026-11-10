# Architecture

The state machine owns navigation. The renderer owns presentation.

```zen-flowchart
{
  "title": "From input to frame",
  "description": "State and presentation have separate owners.",
  "nodes": [
    {"id":"input","label":"Input","detail":"Translate device events","x":0,"y":0},
    {"id":"state","label":"State machine","detail":"Apply navigation intent","x":0,"y":180},
    {"id":"frame","label":"Frame","detail":"Render the current state","x":0,"y":360}
  ],
  "edges": [
    {"from":"input","to":"state","label":"action"},
    {"from":"state","to":"frame","label":"snapshot"}
  ]
}
```

## Ownership

The input worker publishes actions to the UI thread. Shutdown joins the worker.

[Return to overview](overview.md)
