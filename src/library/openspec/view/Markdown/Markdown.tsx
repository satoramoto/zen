import type { ReactNode } from 'react';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import type { Block, Inline } from '../../model/markdown';
import '../openspec.css';

/** Inline Markdown as text runs. */
export function Inlines({ nodes }: { nodes: Inline[] }): ReactNode {
  return nodes.map((n, i) => {
    switch (n.kind) {
      case 'text':
        return n.text;
      case 'code':
        return (
          <Text key={i} as="code" role="code" size="inherit" className="os-doc__inline-code">
            {n.text}
          </Text>
        );
      case 'strong':
        return (
          <Text key={i} as="strong" size="inherit" weight="strong">
            <Inlines nodes={n.children} />
          </Text>
        );
      case 'em':
        return (
          <em key={i}>
            <Inlines nodes={n.children} />
          </em>
        );
      case 'link':
        return (
          <a key={i} href={n.href} className="os-doc__link" target="_blank" rel="noreferrer">
            {n.text}
          </a>
        );
    }
  });
}

export interface MarkdownProps {
  blocks: Block[];
  /** Headings are drawn one level smaller than written, so a document's `#` fits under a page's own title. Default 1. */
  demote?: number;
}

/**
 * **Job.** A run of Markdown blocks as zen text: headings at the heading role, paragraphs at
 * the reading leading, lists (task boxes as marks), code in a well, quotes with a rule.
 */
export function Markdown({ blocks, demote = 1 }: MarkdownProps) {
  return (
    <div className="os-doc">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'heading': {
            const level = Math.min(6, b.level + demote);
            const as = `h${level}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
            return (
              <Text key={i} as={as} role="heading" size={level <= 2 ? undefined : 'body'} weight="strong" tone="primary" className="os-doc__h">
                <Inlines nodes={b.children} />
              </Text>
            );
          }
          case 'paragraph':
            return (
              <Text key={i} as="p" role="body" className="os-doc__p">
                <Inlines nodes={b.children} />
              </Text>
            );
          case 'list': {
            const plain = b.items.some((it) => it.checked !== undefined);
            return (
              <Text key={i} as={b.ordered ? 'ol' : 'ul'} role="body" className="os-doc__list" data-plain={plain ? '' : undefined}>
                {b.items.map((it, j) => (
                  <li key={j} className="os-doc__item" data-depth={it.depth || undefined}>
                    {it.checked !== undefined && <span aria-hidden="true">{it.checked ? '☑ ' : '☐ '}</span>}
                    <Inlines nodes={it.children} />
                  </li>
                ))}
              </Text>
            );
          }
          case 'code':
            return (
              <Surface key={i} material="well" radius="input">
                <Text as="pre" role="code" size="caption" tone="primary" className="os-doc__code" data-language={b.language}>
                  {b.text}
                </Text>
              </Surface>
            );
          case 'quote':
            return (
              <Text key={i} as="blockquote" role="body" tone="secondary" className="os-doc__quote">
                <Inlines nodes={b.children} />
              </Text>
            );
        }
      })}
    </div>
  );
}
