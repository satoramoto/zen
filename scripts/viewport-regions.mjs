import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.STORYBOOK_URL??execFileSync('node',[`${process.env.HOME}/Projects/satoramoto/zen-flow/herdr/scripts/previews.mjs`,'url',process.cwd()],{encoding:'utf8'}).trim();
const index=await (await fetch(new URL('index.json',base))).json();
const stories=Object.values(index.entries).filter(s=>s.type==='story'&&s.id.startsWith('math-components-plotviewport-regions--'));
if(!stories.length)throw Error('No region scenarios discovered');
const output='.shots/viewport-regions';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
try {
  for(const renderer of ['react','svelte'])for(const width of [390,1280])for(const story of stories){
    const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(new URL(`iframe.html?id=${story.id}&viewMode=story&globals=renderer:${renderer}`,base).href);
    await page.waitForFunction(()=>['finished','errored'].includes(window.__STORYBOOK_PREVIEW__?.storyRenders?.[0]?.phase),null,{timeout:60000});
    const result=await page.evaluate(()=>({phase:window.__STORYBOOK_PREVIEW__.storyRenders[0].phase,overflow:document.documentElement.scrollWidth>innerWidth}));
    if(story.id.endsWith('--accessible-selection')){
      const region=page.getByRole('button',{name:'Left region'}),box=await region.boundingBox();
      const state=()=>page.locator('[data-state]').evaluate(el=>JSON.parse(el.textContent));
      const before=await state(),x=box.x+box.width/2,y=box.y+box.height/2;
      await page.mouse.click(x,y);
      await page.waitForFunction(n=>JSON.parse(document.querySelector('[data-state]').textContent).calls.length===n,before.calls.length+1);
      assert.deepEqual((await state()).calls,[...before.calls,'left']);
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+30,y+20,{steps:5});await page.mouse.up();
      assert.deepEqual((await state()).camera,before.camera);
      assert.equal((await state()).calls.length,before.calls.length+1);
      await region.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');
      assert.deepEqual((await state()).calls,[...before.calls,'left','left','left']);
    }
    if(result.phase==='errored'||errors.length||result.overflow)throw Error(`${renderer}/${width}/${story.id}: ${JSON.stringify({result,errors})}`);
    await page.screenshot({path:`${output}/${renderer}-${width}-${story.id}.png`,fullPage:true});
    results.push({renderer,width,story:story.id,...result});console.log('PASS',renderer,width,story.id);await page.close();
  }
  await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
