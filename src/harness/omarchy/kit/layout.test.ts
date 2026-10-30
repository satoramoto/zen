import {describe,expect,it} from 'vitest';
import {arrange,lines} from './layout.mjs';
import {button,column,row,text,section} from './ui.mjs';
import {dark} from './theme.mjs';
describe('shared Omarchy geometry',()=>{
  it('wraps tabs without clipping at the narrow floor',()=>{
    const layout=arrange(row(['Quick','Levels','Routing','Hardware','Advanced'].map(label=>button(label,'tab'))),348,dark);
    expect(layout.children.some(b=>b.y>0)).toBe(true);
    layout.children.forEach(b=>expect(b.x+b.width).toBeLessThanOrEqual(348));
  });
  it('gives growing text the space left by controls',()=>{
    const layout=arrange(row([text('Name',{grow:true}),button('Mute','mute')]),808,dark);
    expect(layout.children[0].width+8+layout.children[1].width).toBe(808);
  });
  it('makes line breaks and section spacing deterministic, without renderer imports',()=>{
    expect(lines('one two three four',48,13)).toEqual(['one','two','three','four']);
    const tree=column([section('Section',[text('A label',{detail:'Its detail'})])]);
    expect(JSON.parse(JSON.stringify(arrange(tree,348,dark)))).toEqual(arrange(tree,348,dark));
  });
});
