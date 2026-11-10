# Architecture

The state machine owns navigation. The renderer owns presentation.

## Ownership

The input worker publishes actions to the UI thread. Shutdown joins the worker.

[Return to overview](overview.md)
