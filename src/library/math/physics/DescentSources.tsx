import { allDescentSources, SOURCE_COMMIT } from './model/sources';
import './physics.css';

/**
 * Where every number in the descent comes from: the same registry `SOURCES.md` is written from.
 * Each row cites a Luminary 099 file and line, or gives its reason for being an approximation.
 */
export function DescentSources() {
  const rows = allDescentSources();
  return (
    <div className="zen-physics zen-physics__scroll">
      <table className="zen-physics__table">
        <caption>
          Every number in the descent, cited to Luminary 099 (commit {SOURCE_COMMIT.slice(0, 7)}) or marked as an approximation.
        </caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">What it is</th>
            <th scope="col">Source</th>
            <th scope="col">Approximation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.name} data-source={v.cite ? 'cited' : 'approximation'}>
              <th scope="row">{v.name}</th>
              <td>{v.what}</td>
              <td>{v.cite ? <code>{`${v.cite.file}:${v.cite.line}`}</code> : '—'}</td>
              <td>{v.approximation ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
