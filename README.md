# Awesome Design

An interactive React/TypeScript field guide to typography, grids, color, and interface styling. Six books, eighteen original illustrations, and a Storybook workshop for inspecting each principle.

## Development

Use Node.js 22.12+ and npm. Run `npm install`, then `npm run dev`.

The unified launcher starts the app on http://127.0.0.1:4191 and Storybook on http://127.0.0.1:6021. Ctrl-C stops both. To use other ports:

```sh
PREVIEW_LABEL="Awesome Design" PREVIEW_PORT=4191 STORYBOOK_PORT=6021 npm run dev
```

Do not start independent child servers. If a preview fails, stop its entire owned group and restart the launcher. It refuses occupied ports and never stops unrelated processes.

## Checks

`npm run typecheck`, `npm test`, `npm run build`, `npm run build:storybook`.

## Reference boundary

Principles are paraphrased teaching takeaways, not quotations or exhaustive summaries. Illustrations are original applications, not reproduced book pages. References and the earlier two-agent concept reviews are in `docs/`.
