import { useMemo } from 'react';
import { ActionButton } from '../../components/core/ActionButton/ActionButton';
import type { Entry } from '../model/api';
import { openUrl } from '../model/ipc';
import { credits, PACK_PAGE, TAKEDOWN } from '../model/pack';
import './Credits.css';

const count = (n: number) => n.toLocaleString('en-US');

/**
 * **Job.** Where the presets come from, the terms they come under, and everyone the library's
 * file names credit, shown in place of the preset list (the library, or ⚙ Settings' Presets).
 *
 * **Changed.** Type on space alone, no rules (near borderless); the counts are tabular figures
 * in the readout face; "← Presets" is a quiet core `ActionButton`. Links open through the model's
 * bridge (`model/ipc` `openUrl`), as Tauri's opener plugin did.
 *
 * **Kept.** The copy, the links and their tooltips, the authors' list (`aria-label="authors"`)
 * and its empty state.
 */
export function Credits({ entries, onBack }: { entries: Entry[]; onBack(): void }) {
  const authors = useMemo(() => credits(entries), [entries]);
  return (
    <div className="vs-credits">
      <div className="vs-credits-head">
        <h2>Credits</h2>
        <ActionButton tone="quiet" onPress={onBack} title="Back to the presets">
          ← Presets
        </ActionButton>
      </div>
      <div className="vs-credits-body">
        <p>
          The presets come from projectM's{' '}
          <a
            href={PACK_PAGE}
            title={PACK_PAGE}
            onClick={(e) => {
              e.preventDefault();
              void openUrl(PACK_PAGE);
            }}
          >
            Cream of the Crop
          </a>
          , curated by ISOSCELES from decades of MilkDrop presets.
        </p>
        <p>
          Their authors released them freely, with no license; each author keeps their rights. Any author can ask for theirs to be taken out:{' '}
          <a
            href={TAKEDOWN}
            title={TAKEDOWN}
            onClick={(e) => {
              e.preventDefault();
              void openUrl(TAKEDOWN);
            }}
          >
            ask for a takedown
          </a>
          .
        </p>
        <h3>
          {authors.length ? `${count(authors.length)} authors` : 'Authors'}
          <span className="vs-credits-sub"> in this library, by presets</span>
        </h3>
        {authors.length ? (
          <ul className="vs-credits-list" aria-label="authors">
            {authors.map((c) => (
              <li key={c.author}>
                <span className="vs-credits-name">{c.author}</span>
                <span className="vs-credits-count">{count(c.count)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vs-credits-none">No authors named in the presets' file names yet.</p>
        )}
      </div>
    </div>
  );
}
