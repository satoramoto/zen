import { useId, useState, type ReactNode } from 'react';
import { Text } from '../primitives/Text';
import { Stack } from '../primitives/Stack';
import './Documentation.css';

export interface SiteLink { title: string; href: string }
export interface SitePage extends SiteLink { text: string }
export interface DocumentationProps {
  title: string;
  description?: string;
  home: string;
  current: string;
  pages: SitePage[];
  references?: SiteLink[];
  revision?: string;
  source?: string;
  html: string;
  search?: ReactNode;
  content?: ReactNode;
}

/** A small optional island: all document links remain available without hydration. */
export function Search({ pages }: { pages: SitePage[] }) {
  const [query, setQuery] = useState('');
  const id = useId();
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = terms.length ? pages.filter(page => terms.every(term =>
    `${page.title} ${page.text}`.toLocaleLowerCase().includes(term))).slice(0, 12) : [];
  return <section className="zen-site-search" aria-label="Documentation search">
    <label htmlFor={id}>Search the documentation</label>
    <input id={id} type="search" value={query} placeholder="Find a concept…"
      onChange={event => setQuery(event.currentTarget.value)} />
    {terms.length > 0 && <div className="zen-site-search__results">
      <p role="status">{matches.length ? `${matches.length} matching pages` : 'No matching pages'}</p>
      <ul>{matches.map(page => <li key={page.href}><a href={page.href}>{page.title}</a></li>)}</ul>
    </div>}
  </section>;
}

/** Shared static reading shell. html is trusted, repository-authored Markdown output. */
export function Documentation({ title, description, home, current, pages, references = [], revision, source, html, search, content }: DocumentationProps) {
  return <div className="zen-site">
    <a className="zen-site__skip" href="#content">Skip to content</a>
    <header className="zen-site__header">
      <Stack gap={1}>
        <a className="zen-site__brand" href={home}><Text role="heading">{title}</Text></a>
        {description && <Text role="caption" tone="secondary">{description}</Text>}
      </Stack>
      <Text role="caption" tone="muted">PROJECT FIELD NOTES</Text>
    </header>
    <div className="zen-site__layout">
      <aside className="zen-site__sidebar">
        {search ?? <Search pages={pages} />}
        <nav aria-label="Documentation"><ul>{pages.map(page => <li key={page.href}>
          <a href={page.href} aria-current={page.href === current ? 'page' : undefined}>{page.title}</a>
        </li>)}</ul></nav>
        {references.length > 0 && <nav aria-label="Generated references">
          <Text role="label" tone="muted">GENERATED REFERENCE</Text>
          <ul>{references.map(link => <li key={link.href}><a href={link.href}>{link.title} ↗</a></li>)}</ul>
        </nav>}
      </aside>
      <main id="content" tabIndex={-1}>
        {content ? <article className="zen-site__prose">{content}</article>
          : <article className="zen-site__prose" dangerouslySetInnerHTML={{ __html: html }} />}
        <footer className="zen-site__footer">
          <Text role="caption" tone="secondary">Built from source{revision ? ` · ${revision}` : ''}</Text>
          {source && <a href={source}>View source</a>}
        </footer>
      </main>
    </div>
  </div>;
}
