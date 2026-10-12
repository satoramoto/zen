import type { Facets, Mode } from '../contract';
import { toCssVars } from '../contract';
import type { ThemePack } from '../themes/packs';
import { Card, SectionHead } from '../components';
import './screens.css';
import './inspector.css';

// Shows the composed theme: where it came from, the rules it keeps, and
// every contract variable with its current value.

export function ThemeInspector({ pack, facets, mode = 'dark' }: { pack: ThemePack; facets: Facets; mode?: Mode }) {
  const vars = Object.entries(toCssVars(facets, mode));
  const colours = vars.filter(([, v]) => v.startsWith('#'));
  const rest = vars.filter(([, v]) => !v.startsWith('#'));
  const swapped = (Object.keys(facets) as (keyof Facets)[]).filter((k) => facets[k].id !== pack.facets[k].id);

  return (
    <div className="lib-stack inspector">
      <div className="inspector__head">
        <div>
          <div className="stage__eyebrow">Theme pack</div>
          <div className="stage__title">{pack.label}</div>
          <p className="lib-card__body">{pack.northStar}</p>
        </div>
        <Card eyebrow="Source" title={pack.source.name}>
          <a className="inspector__link" href={pack.source.url} target="_blank" rel="noreferrer">
            {pack.source.url}
          </a>
          {pack.source.referoId && <code className="inspector__code">Refero style {pack.source.referoId}</code>}
        </Card>
      </div>

      <div className="inspector__facets">
        {(Object.keys(facets) as (keyof Facets)[]).map((k) => (
          <Card key={k} eyebrow={swapped.includes(k) ? `${k} · swapped` : k} title={facets[k].label} />
        ))}
      </div>

      <section>
        <SectionHead>Rules this pack keeps</SectionHead>
        <ul className="inspector__rules">
          {pack.keep.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section>
        <SectionHead aside={`${colours.length} roles`}>Colour</SectionHead>
        <div className="inspector__swatches">
          {colours.map(([name, value]) => (
            <div key={name} className="inspector__swatch">
              <span className="inspector__chip" style={{ background: `var(${name})` }} />
              <code className="inspector__code">{name}</code>
              <code className="inspector__code inspector__muted">{value}</code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHead aside={`${rest.length} tokens`}>Faces, scale, materials</SectionHead>
        <dl className="inspector__table">
          {rest.map(([name, value]) => (
            <div key={name}>
              <dt className="inspector__code">{name}</dt>
              <dd className="inspector__code inspector__muted">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
