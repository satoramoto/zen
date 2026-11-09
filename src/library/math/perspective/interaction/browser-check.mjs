// Run from the package root against the registry-managed preview.
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const base=process.env.STORYBOOK_URL??'http://127.0.0.1:6007';
const index=await (await fetch(`${base}/index.json`)).json();
const stories=Object.values(index.entries).filter(s=>s.type==='story'&&s.id.startsWith('math-perspective-face-interaction--'));
if(stories.length<10)throw Error('Missing interaction stories');
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw Error(message);};
try{
 await mkdir('node_modules/.cache/viewport-face-picking-orbit',{recursive:true});
 for(const width of [390,1200]){
  const context=await browser.newContext({viewport:{width,height:1000},hasTouch:true});
  const page=await context.newPage();let errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const state=()=>page.locator('[data-state]').evaluate(el=>JSON.parse(el.textContent));
  for(const story of stories){
   errors=[];
   await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`);
   await page.waitForFunction(()=>['finished','errored'].includes(window.__STORYBOOK_PREVIEW__?.currentRender?.phase));
   const result=await page.evaluate(()=>({phase:window.__STORYBOOK_PREVIEW__.currentRender.phase,errors:window.__STORYBOOK_PREVIEW__.currentRender.playFunctionErrors?.map(String)??[]}));
   assert(result.phase==='finished'&&!errors.length&&!result.errors.length,`${story.id}: ${JSON.stringify({result,errors})}`);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${story.id}: horizontal overflow`);
   console.log(`PASS ${width}px ${story.id}`);
  }
  await page.goto(`${base}/iframe.html?id=math-perspective-face-interaction--three-inputs&viewMode=story`);
  await page.waitForFunction(()=>window.__STORYBOOK_PREVIEW__?.currentRender?.phase==='finished');
  const view=page.getByRole('group',{name:'Working view'}),bounds=await view.boundingBox();
  const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
  let before=await state();
  await page.mouse.click(x,y);let after=await state();
  assert(after.calls.length===before.calls.length+1&&after.calls.at(-1).input==='pointer','native pointer tap');
  await page.touchscreen.tap(x,y);after=await state();
  assert(after.calls.at(-1).input==='touch','native touch tap');
  assert(JSON.stringify(after.calls.at(-1).candidateIds)==='["front","coincident","rear"]','native all candidates');
  assert(JSON.stringify(after.pose)===JSON.stringify(before.pose),'tap moved camera');
  await view.focus();await page.keyboard.press('Tab');
  assert(await page.getByRole('button',{name:'Rear face'}).evaluate(el=>el===document.activeElement),'caller-order keyboard focus');
  await page.keyboard.press('Enter');after=await state();
  assert(JSON.stringify(after.calls.at(-1))==='{"candidateIds":["rear"],"input":"keyboard"}','native keyboard identity');
  before=after;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+40,y+24,{steps:4});await page.mouse.move(x,y);await page.mouse.up();
  after=await state();assert(after.calls.length===before.calls.length&&after.cameras.length>before.cameras.length,'drag returning to start selected face');
  const client=await context.newCDPSession(page);
  before=after;
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y:y+20}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  after=await state();assert(after.calls.length===before.calls.length&&after.cameras.length>before.cameras.length,'native cancelled touch drag');
  before=after;
  const probe=page.getByRole('button',{name:'Move probe in Working view'}),pb=await probe.boundingBox();
  await page.mouse.move(pb.x+pb.width/2,pb.y+pb.height/2);await page.mouse.down();await page.mouse.move(pb.x+pb.width/2+12,pb.y+pb.height/2-8,{steps:3});await page.mouse.up();
  after=await state();assert(after.calls.length===before.calls.length&&JSON.stringify(after.probe)!==JSON.stringify(before.probe),'native probe separation');
  await page.screenshot({path:`node_modules/.cache/viewport-face-picking-orbit/interaction-${width}.png`,fullPage:true});
  console.log(`PASS ${width}px native pointer/touch/keyboard/orbit/cancel/probe; screenshot saved`);
  await context.close();
 }
}finally{await browser.close();}
