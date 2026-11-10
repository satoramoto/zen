import type { Walkthrough as Evidence } from 'story-spec/walkthrough';
import './Walkthrough.css';

export interface WalkthroughProps {
  bundle: Evidence;
  /** Build-resolved URLs, keyed by the bundle-relative image path. */
  images: Record<string, string>;
}

/** Screenshot-first, static reading view shared by native and web capture adapters. */
export function Walkthrough({ bundle, images }: WalkthroughProps) {
  return <section className="zen-walkthrough" aria-label={bundle.task.title}>
    <p className="zen-walkthrough__chapter">{bundle.task.chapter}</p>
    <h1>{bundle.task.title}</h1>
    <ol className="zen-walkthrough__steps">{bundle.steps.map((step, index) => <li key={step.id} id={step.id}>
      <figure>
        <div className="zen-walkthrough__image">
          <img src={images[step.image]} width={step.width} height={step.height} alt={step.alt} loading={index ? 'lazy' : 'eager'} />
          {(step.callouts ?? []).map(callout => <span key={callout.number} className="zen-walkthrough__callout" aria-hidden="true"
            style={{ left: `${callout.rect[0] * 100}%`, top: `${callout.rect[1] * 100}%`, width: `${callout.rect[2] * 100}%`, height: `${callout.rect[3] * 100}%` }}>
            <span>{callout.number}</span>
          </span>)}
        </div>
        <figcaption><span className="zen-walkthrough__number">{index + 1}</span> {step.caption}</figcaption>
      </figure>
      {!!step.callouts?.length && <ol className="zen-walkthrough__explanations" aria-label={`Highlights for step ${index + 1}`}>
        {step.callouts.map(callout => <li key={callout.number} value={callout.number}>{callout.text}</li>)}
      </ol>}
    </li>)}</ol>
    <footer className="zen-walkthrough__provenance">
      <p>Verified {bundle.run.adapter} capture · {bundle.run.renderer} · {bundle.run.viewport.width} × {bundle.run.viewport.height}</p>
      {Object.entries(bundle.sources).map(([role, source]) => <p key={role}>
        <a href={source.url}>{role} · {source.revision.slice(0, 7)}</a>{source.dirty ? ' · local changes' : ''}
      </p>)}
    </footer>
  </section>;
}
