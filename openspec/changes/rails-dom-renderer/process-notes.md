# Process notes

- Ruling: plan in zen's own `openspec/`, naming xmrz in `affected_areas` — zen's config has no `store:` line and most of the work is zen's — cost if wrong: move the folder to the zen-flow store.
- Ruling: per-part `.dom.ts` bindings now, generic binding later — moving state, id and context into every model reshapes every model and both of its bindings — cost if wrong: about 40 small files to delete in the follow-up.
- Ruling: leave out music, Yahaha, the assembled and workspace layouts, and Ambient — Market needs only controls — cost if wrong: a later change adds them one line each.
- Ruling: the form field is the controller's (`field`, `values`), not a prop — Select already uses `name` as a visible caption — cost if wrong: a rename in the helper.
- Ruling: zen controls don't sit inside a `<label>` — a click on the label would press the trigger again — cost if wrong: Market's markup changes back.
- Ruling: the watch control goes on `coins/show`, loaded by one lazy frame, while board rows keep native stars — a frame per row would make the board slower — cost if wrong: the board stays native.
- Ruling: plays for the DOM renderer come from a `--renderer` flag on the story runner, not new stories per part — the existing Core plays already describe the behaviour — cost if wrong: Core takes about twice as long in CI.
- Ruling: vendor files with a script, not a gem — one app today — cost if wrong: package the script as a gem later.
- Open, asked of the person: which pack Market wears (no pack is named `zen`; my pick is `linear`).
- Ruling: Market wears `linear`, the pick I offered when I asked which pack — the person answered by asking for the change to be applied, not with a pack — cost if wrong: re-vendor with another pack's stylesheet and change one attribute on `<body>`.
- Ruling: the import-map requirement ("imports nothing but Stimulus") leaves the spec and stays a build check (`check:lib`) — the stories are the spec, and no story can read the built bundle — cost if wrong: nothing behaves differently; only where the rule is written.
- Ruling: plays of the browser-tagged Core stories under `--renderer dom` are run locally, not in CI — CI's pull-request run is the virtual DOM only — cost if wrong: a DOM-only browser failure is found on main, as for React today.
- Ruling: the zen worktree and an xmrz worktree, not the checkouts — other agents are in both — cost if wrong: none.
