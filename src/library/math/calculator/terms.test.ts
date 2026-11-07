import {expect,it} from 'vitest';
import {expressionTerms,matchingTerms,transformTerm} from './terms';
import {compileExpressions} from './expression';
const value=(source:string,x=2)=>compileExpressions({f:source,g:'0',h:'f(x)'}).evaluate('h',x,{a:3});
it('transforms one subtree while preserving grouping and siblings',()=>{
 const source='a*(x+1)';const term=expressionTerms(source).find(t=>t.source==='(x+1)')!;
 expect(value(transformTerm(source,term.path,'half'))).toBe(4.5);
 expect(value(transformTerm(source,term.path,'shift'))).toBe(6);
 expect(value(transformTerm(source,term.path,'repeat'))).toBe(15);
 expect(value(source)).toBe(9);
});
it('distinguishes repeated occurrences and changes only the chosen one',()=>{
 const terms=matchingTerms('sin(x)+sin(x)','sin((x))');expect(terms).toHaveLength(2);expect(terms[0].key).not.toBe(terms[1].key);
 expect(value(transformTerm('sin(x)+sin(x)',terms[1].path,'flip'))).toBeCloseTo(0);
});
it('composes function arguments correctly and refuses stale paths or positionless shifts',()=>{
 const transformed=transformTerm('f(x)+1',['left'],'repeat');
 expect(compileExpressions({f:'x^2',g:transformed,h:'g(x)'}).evaluate('h',3,{})).toBe(37);
 expect(()=>transformTerm('a',[],'shift')).toThrow(/containing x/);
 expect(()=>transformTerm('a',['left'],'half')).toThrow(/changed/);
});
it('does not accidentally transform names containing x and uses a bounded envelope',()=>{
 expect(value(transformTerm('exp(x)',[],'shift'))).toBeCloseTo(Math.E);
 const source=transformTerm('1',[],'envelope');expect(value(source,0)).toBe(1);expect(value(source,-2)).toBeCloseTo(value(source,2));
});
