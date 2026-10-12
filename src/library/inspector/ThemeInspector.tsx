import type { ReactNode } from 'react';
import type { Facets, Mode } from '../contract';
import { toCssVars } from '../contract';
import type { ThemePack } from '../themes/packs';
import { Group } from '../layout';
import './ThemeInspector.css';

// Shows the composed theme: where it came from, the rules it keeps, and
// every contract variable with its current value in the given mode.

function Panel({ eyebrow, title, children }: { eyebrow?: ReactNode; title?: ReactNode; children?: ReactNode }) {
  return (
    <section className="inspector__panel">
      {eyebrow && <div className="inspector__eyebrow">{eyebrow}</div>}
      {title && <h3 className="inspector__panel-title">{title}</h3>}
      {children}
    </section>
  );
}

export function ThemeInspector({ pack, facets, mode = 'dark' }: { pack: ThemePack; facets: Facets; mode?: Mode }) {
  const vars = Object.entries(toCssVars(facets, mode));
  const colours = vars.filter(([, v]) => v.startsWith('#'));
  const rest = vars.filter(([, v]) => !v.startsWith('#'));
  const swapped = (Object.keys(facets) as (keyof Facets)[]).filter((k) => facets[k].id !== pack.facets[k].id);

  return (
    <div className="inspector" data-mode={mode}>
      <div className="inspector__head">
        <div>
          <div className="inspector__eyebrow">Theme pack · {mode}</div>
          <div className="inspector__title">{pack.label}</div>
          <p className="inspector__body">{pack.northStar}</p>
        </div>
        <Panel eyebrow="Source" title={pack.source.name}>
          <a className="inspector__link" href={pack.source.url} target="_blank" rel="noreferrer">
            {pack.source.url}
          </a>
          {pack.source.referoId && <code className="inspector__code">Refero style {pack.source.referoId}</code>}
        </Panel>
      </div>

      <div className="inspector__facets">
        {(Object.keys(facets) as (keyof Facets)[]).map((k) => (
          <Panel key={k} eyebrow={swapped.includes(k) ? `${k} · swapped` : k} title={facets[k].label} />
        ))}
      </div>

      <Group name="Rules this pack keeps" direction="column">
        <ul className="inspector__rules">
          {pack.keep.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Group>

      <Group name="Colour" aside={`${colours.length} roles`} direction="column">
        <div className="inspector__swatches">
          {colours.map(([name, value]) => (
            <div key={name} className="inspector__swatch">
              <span className="inspector__chip" style={{ background: `var(${name})` }} />
              <code className="inspector__code">{name}</code>
              <code className="inspector__code inspector__muted">{value}</code>
            </div>
          ))}
        </div>
      </Group>

      <Group name="Faces, scale, materials" aside={`${rest.length} tokens`} direction="column">
        <dl className="inspector__table">
          {rest.map(([name, value]) => (
            <div key={name}>
              <dt className="inspector__code">{name}</dt>
              <dd className="inspector__code inspector__muted">{value}</dd>
            </div>
          ))}
        </dl>
      </Group>
    </div>
  );
}
