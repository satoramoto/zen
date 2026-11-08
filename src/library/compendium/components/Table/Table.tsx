import type { ReactNode } from 'react';
import { Text } from '../../../primitives/Text';
import './Table.css';

export interface TableProps {
  /** The caption, read as the table's name. */
  label: string;
  head: ReactNode[];
  rows: ReactNode[][];
  /** Each row's first cell is a row head. */
  rowHeads?: boolean;
}

/**
 * **Job.** A real table in the reading column: a caption, column heads, rows of cells (formulas,
 * live values, words), the first cell of each row a head when asked. Wider than the column, it
 * scrolls sideways in its own box and never widens the page.
 */
export function Table({ label, head, rows, rowHeads = false }: TableProps) {
  return (
    <div className="cmp-table" role="region" aria-label={label} tabIndex={0}>
      <table className="cmp-table__table">
        <caption className="cmp-table__caption">
          <Text role="label" size="caption" tone="muted">
            {label}
          </Text>
        </caption>
        <thead>
          <tr>
            {head.map((cell, i) => (
              <th key={i} scope="col" className="cmp-table__head">
                <Text role="label" tone="secondary">
                  {cell}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) =>
                rowHeads && j === 0 ? (
                  <th key={j} scope="row" className="cmp-table__cell cmp-table__rowhead">
                    <Text role="label" tone="primary">
                      {cell}
                    </Text>
                  </th>
                ) : (
                  <td key={j} className="cmp-table__cell">
                    <Text role="body" tone="primary">
                      {cell}
                    </Text>
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
