import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.MATH_PREVIEW_URL??'http://127.0.0.1:6028';
await mkdir('.shots/perspective',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const story of ['projection-explorer--break-the-illusion','optical-paths--rescue-the-ray','spatial-optics--inspect-a-path','stereo-explorer--cross-the-zero-plane']){
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{let channel;window.__plays=[];Object.defineProperty(window,'__STORYBOOK_ADDONS_CHANNEL__',{configurable:true,get:()=>channel,set:c=>{channel=c;for(const name of ['storyFinished','storyThrewException','playFunctionThrewException'])c.on(name,e=>window.__plays.push({name,status:e?.status,message:e?.message}));}});});
  await page.goto(`${base}/iframe.html?id=math-${story}&viewMode=story&globals=theme:linear;mode:dark`);
  await page.waitForFunction(()=>window.__plays.some(e=>e.name==='storyFinished'),{},{timeout:45000});
  const events=await page.evaluate(()=>window.__plays);assert.ok(events.every(e=>e.name==='storyFinished'&&e.status==='success'),JSON.stringify(events));assert.deepEqual(errors,[]);console.log('PASS play',story);await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const story of ['projection-explorer--anamorphic-message','projection-explorer--forced-perspective','optical-paths--finite-pupil','spatial-optics--solid-prism','spatial-optics--out-of-plane','stereo-explorer--binocular-depth','components-projection-view--cabinet','components-ray-path-view--glass','components-stereo-pair--parallel']){
  await page.goto(`${base}/iframe.html?id=math-${story}&viewMode=story&globals=theme:linear;mode:dark`);await page.locator('.zen-perspective svg').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`.shots/perspective/${story}.png`,fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));console.log('PASS specimen',story);
 }
 await page.goto(`${base}/iframe.html?id=math-projection-explorer--four-projections&viewMode=story&globals=theme:linear;mode:dark`);
 const probe=page.getByRole('button',{name:'Move probe in Perspective view'});await probe.waitFor();await page.evaluate(()=>document.fonts.ready);
 const before=await page.getByLabel('Probe world coordinates').textContent(),box=await probe.boundingBox();
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+45,box.y+box.height/2-15,{steps:8});await page.mouse.up();
 assert.notEqual(await page.getByLabel('Probe world coordinates').textContent(),before);
 const svg=page.getByRole('group',{name:'Orthographic view'}),sb=await svg.boundingBox();
 await page.mouse.move(sb.x+30,sb.y+30);await page.mouse.down();await page.mouse.move(sb.x+100,sb.y+30,{steps:8});await page.mouse.up();assert.notEqual(await page.getByRole('slider',{name:'Scene turn'}).inputValue(),'0');
 const angle=Number(await page.getByRole('slider',{name:'Scene turn'}).inputValue());await svg.focus();await page.keyboard.press('ArrowRight');assert.equal(Number(await page.getByRole('slider',{name:'Scene turn'}).inputValue()),angle+2);
 await page.getByRole('button',{name:'The dolly zoom',exact:true}).click();const width=await page.getByLabel('Reference plane width').textContent();await page.getByRole('slider',{name:'Camera distance'}).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByLabel('Reference plane width').textContent(),width);
 console.log('PASS pointer probe, shared orbit, dolly scale');
 await page.goto(`${base}/iframe.html?id=math-spatial-optics--solid-prism&viewMode=story&globals=theme:linear;mode:dark`);
 const steer=page.getByRole('group',{name:'Steer spatial ray',exact:true});await steer.waitFor();await steer.focus();await page.keyboard.press('ArrowUp');assert.ok(Number(await page.getByRole('slider',{name:'Ray elevation',exact:true}).inputValue())>0);
 console.log('PASS spatial ray keyboard steering');
 for(const story of ['projection-explorer--anamorphic-message','optical-paths--mirrors-and-glass','spatial-optics--solid-prism','stereo-explorer--convergence-plane']){
  await page.setViewportSize({width:390,height:844});await page.goto(`${base}/iframe.html?id=math-${story}&viewMode=story&globals=theme:linear;mode:light`);await page.locator('.zen-perspective svg').first().waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`.shots/perspective/narrow-${story}.png`,fullPage:true});console.log('PASS narrow light',story);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
