import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { books, examples, type ExampleId } from './catalog';
import { PrincipleExample, type PrincipleExampleProps } from './PrincipleExample';
import * as typeStories from './stories/ThinkingWithType.stories';
import * as gridStories from './stories/GridSystems.stories';
import * as colorStories from './stories/InteractionOfColor.stories';
import * as uiStories from './stories/RefactoringUI.stories';
import * as webStories from './stories/OnWebTypography.stories';
import * as detailStories from './stories/PracticalTypography.stories';

describe('catalog and navigation',()=>{
 it('assigns all 18 unique examples to six books and provides sources',()=>{
  const ids=books.flatMap(book=>book.examples);
  expect(ids).toHaveLength(18);expect(new Set(ids).size).toBe(18);expect(Object.keys(examples)).toEqual(ids);
  for(const book of books){expect(book.examples).toHaveLength(3);expect(book.reference.url).toMatch(/^https:\/\//);}
 });
 it('navigates every book and preserves an experiment state on return',()=>{
  render(<App/>);
  fireEvent.click(screen.getByRole('checkbox',{name:'Distinct type roles'}));
  const navigation=screen.getByRole('navigation',{name:'Choose a book'});
  for(const book of books){
   fireEvent.click(within(navigation).getByRole('button',{name:new RegExp(book.subject)}));
   expect(screen.getByRole('region',{name:book.title})).toBeVisible();
   expect(screen.getAllByRole('article')).toHaveLength(3);
  }
  fireEvent.click(within(navigation).getByRole('button',{name:/01 Typography/}));
  expect(screen.getByRole('checkbox',{name:'Distinct type roles'})).not.toBeChecked();
 });
});

describe('all eighteen independent controls',()=>{
 const toggles=(Object.keys(examples) as ExampleId[]).filter(id=>!['T2','C3','W1','W3'].includes(id));
 for(const id of toggles) it(`${id} applies and removes the principle via its labeled control`,()=>{
  const {container}=render(<PrincipleExample id={id}/>);
  const checkbox=screen.getByRole('checkbox',{name:examples[id].control});
  const article=container.querySelector('article')!;
  const original=examples[id].defaultApplied;
  expect(article).toHaveAttribute('data-applied',String(original));
  fireEvent.click(checkbox);
  expect(article).toHaveAttribute('data-applied',String(!original));
  expect(checkbox).toHaveProperty('checked',!original);
 });
 it('T2 changes measure with an effective small-screen minimum, preserving paragraph content',()=>{
  const {container}=render(<PrincipleExample id="T2"/>);const p=container.querySelector('.reading')!;const original=p.textContent;
  fireEvent.change(screen.getByRole('slider'),{target:{value:'16'}});expect((p as HTMLElement).style.maxWidth).toBe('16ch');
  fireEvent.change(screen.getByRole('slider'),{target:{value:'76'}});expect((p as HTMLElement).style.maxWidth).toBe('76ch');expect(p.textContent).toBe(original);
 });
 it('C3 changes only the surround HSL hue, retaining the gray center',()=>{
  const {container}=render(<PrincipleExample id="C3"/>);const center=container.querySelector('.gray-square')!;const initialCenter=center.getAttribute('style');
  const initialSurround=container.querySelector('.hue-field')!.getAttribute('style');
  fireEvent.change(screen.getByRole('slider'),{target:{value:'200'}});
  expect(container.querySelector('.hue-field')!.getAttribute('style')).not.toBe(initialSurround);
  expect(center.getAttribute('style')).toBe(initialCenter);
  expect(screen.getByRole('img')).toHaveAccessibleName('Fixed gray square against a 200 degree hue surround');
  expect(screen.getByText(/Constant HSL lightness does not mean/)).toBeInTheDocument();
 });
 it('W1 changes headline family without changing wording or size',()=>{
  const {container}=render(<PrincipleExample id="W1"/>);const title=container.querySelector('.voice-title')!;const content=title.textContent;
  fireEvent.change(screen.getByRole('combobox'),{target:{value:'technical'}});expect(title).toHaveStyle({fontFamily:'ui-monospace, monospace'});expect(title.textContent).toBe(content);
 });
 it('W3 changes the requested width from160 to640 while retaining viewport cap',()=>{
  const {container}=render(<PrincipleExample id="W3"/>);const shell=container.querySelector('.responsive-shell')!;
  fireEvent.change(screen.getByRole('slider'),{target:{value:'160'}});expect(shell).toHaveStyle({width:'160px',maxWidth:'100%'});
  fireEvent.change(screen.getByRole('slider'),{target:{value:'640'}});expect(shell).toHaveStyle({width:'640px',maxWidth:'100%'});
 });
});

describe('teaching invariants',()=>{
 it('C1 keeps the two centers identical across context changes',()=>{
  const {container}=render(<PrincipleExample id="C1"/>);const centers=container.querySelectorAll('.gray-square');
  for(const center of centers)expect(center).toHaveStyle({backgroundColor:'#929292'});
  fireEvent.click(screen.getByRole('checkbox'));for(const center of centers)expect(center).toHaveStyle({backgroundColor:'#929292'});
 });
 it('C2 keeps the accent fixed when the surface changes',()=>{
  const {container}=render(<PrincipleExample id="C2"/>);const accents=container.querySelectorAll('.accent-bar,.accent-dot');
  fireEvent.click(screen.getByRole('checkbox'));for(const accent of accents)expect(accent).toHaveStyle({backgroundColor:'#d79b54'});
 });
 it('R1 keeps focal amount size and weight fixed',()=>{
  const {container}=render(<PrincipleExample id="R1"/>);const amount=container.querySelector('.invoice-total')!;
  expect(amount).toHaveStyle({fontSize:'32px',fontWeight:'500'});fireEvent.click(screen.getByRole('checkbox'));expect(amount).toHaveStyle({fontSize:'32px',fontWeight:'500'});
 });
 it('W2 changes navigation font only and preserves editorial markup',()=>{
  const {container}=render(<PrincipleExample id="W2"/>);const body=container.querySelector('.body')!.outerHTML;const title=container.querySelector('.title')!.outerHTML;
  fireEvent.click(screen.getByRole('checkbox'));expect(container.querySelector('.journal-nav')).toHaveStyle({fontFamily:'Georgia, serif'});expect(container.querySelector('.body')!.outerHTML).toBe(body);expect(container.querySelector('.title')!.outerHTML).toBe(title);
 });
 it('B1 changes leading only, holding font, size, and measure',()=>{
  const {container}=render(<PrincipleExample id="B1"/>);const p=container.querySelector('.leading-text')!;expect((p as HTMLElement).style.maxWidth).toBe('64ch');
  expect(p).toHaveStyle({fontFamily:'Georgia, serif',fontSize:'17px',lineHeight:'1.35'});
  fireEvent.click(screen.getByRole('checkbox'));expect(p).toHaveStyle({fontFamily:'Georgia, serif',fontSize:'17px',lineHeight:'1.05'});
 });
 it('B2 retains bold on the essential instruction',()=>{
  const {container}=render(<PrincipleExample id="B2"/>);expect(container.querySelector('strong')).toHaveTextContent('save your changes.');expect(container.querySelector('.emphasis-text span')).toHaveStyle({fontWeight:'400'});
  fireEvent.click(screen.getByRole('checkbox'));expect(container.querySelector('strong')).toHaveTextContent('save your changes.');expect(container.querySelector('.emphasis-text span')).toHaveStyle({fontWeight:'700'});
 });
 it('B3 substitutes the appropriate punctuation while preserving the compound hyphen',()=>{
  const {container}=render(<PrincipleExample id="B3"/>);expect(container.querySelector('.punctuation p')).toHaveTextContent('“It’s a well-made notebook—bring it Friday, 2–4 pm.”');
  fireEvent.click(screen.getByRole('checkbox'));expect(container.querySelector('.punctuation p')).toHaveTextContent('"It\'s a well-made notebook -- bring it Friday, 2-4 pm."');
 });
});

describe('Storybook contracts',()=>{
 const groups=[typeStories,gridStories,colorStories,uiStories,webStories,detailStories];
 it('exports exactly18 illustrative stories with source descriptions and meaningful args',()=>{
  const stories=groups.flatMap(group=>Object.entries(group).filter(([key])=>key!=='default').map(([,story])=>story));
  expect(stories).toHaveLength(18);
  for(const story of stories){expect(story).toHaveProperty('args.id');expect(story).toHaveProperty('parameters.docs.description.story');}
 });
 for(const group of groups)for(const [name,story] of Object.entries(group)){
  if(name==='default'||!('args' in story))continue;
  const args=story.args as PrincipleExampleProps;
  it(`${args.id} responds to external Storybook arg changes`,()=>{
   const {container,rerender}=render(<PrincipleExample {...args}/>);
   if(args.id==='T2'){rerender(<PrincipleExample {...args} measure={20}/>);expect(container.querySelector<HTMLElement>('.reading')!.style.maxWidth).toBe('20ch');}
   else if(args.id==='C3'){rerender(<PrincipleExample {...args} hue={200}/>);expect(screen.getByRole('slider')).toHaveValue('200');}
   else if(args.id==='W1'){rerender(<PrincipleExample {...args} voice="technical"/>);expect(container.querySelector('.voice-title')).toHaveStyle({fontFamily:'ui-monospace, monospace'});}
   else if(args.id==='W3'){rerender(<PrincipleExample {...args} width={160}/>);expect(container.querySelector('.responsive-shell')).toHaveStyle({width:'160px'});}
   else{rerender(<PrincipleExample {...args} applied={!args.applied}/>);expect(container.querySelector('article')).toHaveAttribute('data-applied',String(!args.applied));}
  });
 }
});
