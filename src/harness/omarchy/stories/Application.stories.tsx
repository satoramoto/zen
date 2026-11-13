import {useState} from 'react';
import {expect, userEvent, within} from 'storybook/test';
import {Application} from '../bench/Application';
import type {ApplicationNode} from '../kit/application.mjs';
import {element, column, row, text, button, control} from '../kit/application.mjs';
import {ThemeScope,resolveTheme} from '../../../library/theme';

function Example() {
  const [screen,setScreen]=useState('overview');
  const [value,setValue]=useState('');
  const [saved,setSaved]=useState('');
  const tree=element('application',{label:'Example',screen},[
    element('surface',{layer:'float'},[
      element('hero',{label:'Example',detail:'Ready',meta:'Portable application',icon:'brain'}),
      element('tabs',{label:'Example pages',value:screen,action:'navigate',options:[{label:'Overview',value:'overview'},{label:'Output',value:'output'}]}),
    ]),
    screen==='overview'?element('surface',{label:'Settings'},[
      row([control('input','Message',value,'edit',{grow:true,submit:'save'}),button('Save','save')]),
      button('Unavailable','unavailable',{disabled:true}),
      element('meter',{label:'Progress',value:'25%',fraction:.25}),
      text(saved,{role:'status'}),
    ]):column([element('code',{label:'Output',value:saved || 'No output yet.'})]),
  ]) as ApplicationNode;
  return <ThemeScope facets={resolveTheme({theme:"visuals"}).facets} bleed><Application tree={tree} dispatch={(action,_payload,next)=>{
    if(action==='navigate')setScreen(String(next));
    if(action==='edit')setValue(String(next));
    if(action==='save')setSaved(value);
    if(action==='unavailable')throw new Error('Disabled action dispatched');
  }}/></ThemeScope>;
}
export default {title:'Omarchy/Application',component:Example,parameters:{layout:'fullscreen'}};
export const Interaction = {play:async({canvasElement}:{canvasElement:HTMLElement})=>{
  const c=within(canvasElement);
  await userEvent.type(c.getByRole('textbox',{name:'Message'}),'Saved across tabs{Enter}');
  await expect(c.getByRole('status')).toHaveTextContent('Saved across tabs');
  await userEvent.click(c.getByRole('button',{name:'Unavailable'}));
  await userEvent.click(c.getByRole('tab',{name:'Output'}));
  await expect(c.getByLabelText('Output')).toHaveTextContent('Saved across tabs');
  await userEvent.click(c.getByRole('tab',{name:'Overview'}));
  await expect(c.getByRole('textbox',{name:'Message'})).toHaveValue('Saved across tabs');
}};
