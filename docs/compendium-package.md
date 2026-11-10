# Reading a book in an application

Install a pinned GitHub commit of `@satoramoto/zen`. The reader is React-only and
supports server rendering; manuscript, figure framing and checker registration
belong to the application.

```tsx
import '@satoramoto/zen/zen.css';
import { Book, Figure } from '@satoramoto/zen/compendium';
import { paragraph, section, type Book as BookData } from '@satoramoto/zen/compendium/model';
import { UnitCircle } from '@satoramoto/zen/math/trig';
import { expressionChecker } from '@satoramoto/zen/math/expression';

const book: BookData = {
  id: 'example', title: 'An example', chapters: [{
    id: 'opening', title: 'Opening', summary: 'Start here.',
    sections: [section('Start', paragraph('Move the figure to explore.'))],
  }],
};
export const Reader = () => <Book book={book} checkers={{ expression: expressionChecker }} />;
```

Use a `ThemeScope` with the `textbook-console` or `textbook-blueprint` pack around
the reader. `Figure` frames application-owned registry components such as
`UnitCircle`; the book binds named quantities to their props and callbacks.
The executable example in `src/library/compendium/screens/Package/Package.stories.tsx` exercises
this boundary with a figure and checker.

## Supported entries

| Entry | Contract |
| --- | --- |
| `/compendium` | React Book, Document, Reading and book components |
| `/compendium/model` | Framework-free document builders, validation, book and exercise helpers |
| `/math/trig` | React trigonometry figures and their prop types |
| `/math/trig/model` | Framework-free trigonometric calculations |
| `/math/expression` | Framework-free expression parsing and checking |

Import only these public entries, never package-internal source paths. Load
`@satoramoto/zen/zen.css` once. Pure entries do not load React or styles.

For local development, link the Zen checkout and put `zen-source` first in Vite's
resolution conditions, deduplicating React and React DOM. For Astro SSR, also
set `ssr.noExternal: ['@satoramoto/zen']` in source mode. A normal install resolves
the built package without this condition. See `AGENTS.md` for the linking recipe.

The full trigonometry manuscript is maintained by human-free at
`src/books/trigonometry/`, served at `/books/trigonometry/`. Zen owns its reusable
figures and reader; the application's baseline and browser runner hold course parity.
