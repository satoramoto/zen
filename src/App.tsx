import { useState } from 'react';
import { books, type BookId } from './catalog';
import { PrincipleExample } from './PrincipleExample';

export function App() {
  const [selected, setSelected] = useState<BookId>('type');
  const current = books.find(book => book.id === selected)!;
  const currentIndex = books.indexOf(current);
  return <div className="field-guide">
    <a href="#book-content" className="skip-link">Skip to examples</a>
    <header className="site-header"><a href="#" className="wordmark" aria-label="Awesome Design home"><span className="brand-symbol" aria-hidden="true">a*</span>awesome design</a><span className="header-note">A living field guide <span aria-hidden="true">↗</span></span></header>
    <main>
      <section className="intro"><div><div className="eyebrow">Read less passively. See more deliberately.</div><h1>Good design.<br/><em>Made visible.</em></h1><p>Six essential books, eighteen small experiments.<br className="desktop-break"/> Move a slider. Change a rule. Learn to see the difference.</p></div><div className="intro-art" aria-hidden="true"><div className="art-grid"/><div className="art-a">a</div><div className="art-square"/><div className="art-caption">TYPE / SPACE / COLOR</div></div></section>
      <nav className="book-nav" aria-label="Choose a book">{books.map((book,index)=><button key={book.id} type="button" aria-label={`0${index+1} ${book.subject}`} aria-pressed={selected===book.id} onClick={()=>setSelected(book.id)}><span className="book-nav-index">0{index+1}</span><span className="book-nav-subject">{book.subject}</span><span className="book-nav-mark" aria-hidden="true">{book.mark}</span></button>)}</nav>
      <div className="chapter-status" aria-live="polite"><span>{current.title}</span><span>EXPERIMENTS {String(currentIndex*3+1).padStart(2,'0')}–{String(currentIndex*3+3).padStart(2,'0')} / 18</span></div>
      <div id="book-content">{books.map((book,index)=><section className={`chapter chapter-${book.id}`} key={book.id} hidden={selected!==book.id} aria-label={book.title}>
        <header className="chapter-header"><div className="book-cover" aria-hidden="true"><span>0{index+1} / THE READING ROOM</span><div>{book.mark}</div><span>{book.author}</span></div><div className="chapter-info"><div className="eyebrow">The book behind the experiments</div><h2>{book.title}</h2><p className="author">{book.author}</p><p className="chapter-summary">{book.summary}</p><a className="reference-link" href={book.reference.url} target="_blank" rel="noreferrer">Explore the reference ↗</a></div></header>
        <div className="examples">{book.examples.map(id=><PrincipleExample key={id} id={id}/>)}</div>
      </section>)}</div>
      <div className="chapter-pagination"><span>Keep looking. Every small change teaches something.</span><button type="button" onClick={()=>{setSelected(books[(currentIndex+1)%books.length].id);document.getElementById('book-content')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}>Next book: {books[(currentIndex+1)%books.length].subject} <span aria-hidden="true">→</span></button></div>
      <details className="source-note"><summary>A note on sources & these experiments</summary><p>These eighteen principles are paraphrased teaching takeaways, not quotations or exhaustive book summaries. Each illustration is an original React study, with the changed and fixed properties described beneath it.</p><p>Publisher overviews and official contents establish topic alignment; they do not verify every adaptation against a page in the full books. The Albers Foundation describes the teaching approach, and Butterick’s linked chapters are publicly readable. The On Web Typography book link may redirect to its author; the public <a href="https://alistapart.com/article/how-we-read/" target="_blank" rel="noreferrer">How We Read excerpt</a> gives additional context.</p><p>Two independent agents reviewed the preceding HTML concepts; those reports are preserved in the repository’s docs folder. They are not evidence of React or Storybook runtime verification. See repository verification records for this implementation.</p></details>
    </main><footer className="site-footer"><span>awesome design</span><span>Original studies · A companion to the books</span><a href="#">Back to top ↑</a></footer>
  </div>;
}
