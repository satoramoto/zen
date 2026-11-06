// Browser evidence for React-only relationship scenes. Start the unified launcher first.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.MATH_PREVIEW_URL ?? 'http://127.0.0.1:6027';
const output = process.env.MATH_ARTIFACTS ?? '.shots/math-play';
await mkdir(output, { recursive: true });
const browser=await chromium.launch({headless:true});
const prefix='design-os-math-relationships-circle-to-sine--';
const results=[];
function observe(){
 const events=window.__mathEvents=[];
 let channel;
 Object.defineProperty(window,'__STORYBOOK_ADDONS_CHANNEL__',{configurable:true,get:()=>channel,set:value=>{channel=value; for(const name of ['storyFinished','storyThrewException','storyErrored','playFunctionThrewException']) value.on(name,(event)=>events.push({name,status:event?.status,message:event?.message,storyId:event?.storyId}));}});
}
const url=(story,mode='dark',theme='linear')=>`${base}/iframe.html?id=${prefix}${story}&viewMode=story&globals=theme:${theme};mode:${mode}`;
try {
 for(const story of ['playground','twice-around','tall-and-slow','linked-handles','compare-and-reset','play-and-pause']){
  const page=await browser.newPage({viewport:{width:1440,height:1100},colorScheme:'dark'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(observe);
  await page.goto(url(story));
  await page.waitForFunction(()=>window.__mathEvents?.some(e=>e.name==='storyFinished'),{},{timeout:45000});
  const events=await page.evaluate(()=>window.__mathEvents);
  assert.equal(errors.length,0,JSON.stringify(errors));
  assert.equal(events.some(e=>e.name!=='storyFinished'||e.status!=='success'),false,JSON.stringify(events));
  await page.screenshot({path:`${output}/${story}.png`,fullPage:true});
  results.push({story,events,errors});console.log('PASS',story);
  await page.close();
 }
 for(const [width,mode,theme] of [[1440,'dark','linear'],[900,'light','linear'],[560,'dark','visuals'],[390,'light','linear']]){
  const page=await browser.newPage({viewport:{width,height:1000},colorScheme:mode,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url('playground',mode,theme));
  await page.getByRole('slider',{name:'Orbit position'}).waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`${output}/${width}-${mode}.png`,fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);
  const orbit=page.getByRole('slider',{name:'Orbit position'});
  const dot=orbit.locator('.mafs-movable-point-point');const box=await dot.boundingBox();
  const before=Number(await orbit.getAttribute('aria-valuenow'));
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2-30,box.y+box.height/2-25,{steps:10});await page.mouse.up();
  const after=Number(await orbit.getAttribute('aria-valuenow'));
  assert.ok(Math.abs(after-before)>.05,`orbit drag did not move ${width}`);
  assert.equal(await page.getByRole('slider',{name:'Wave position'}).getAttribute('aria-valuenow'),String(after));
  assert.ok(Math.abs(Number(await page.getByLabel('Current height').textContent())-Math.sin(after))<.006);
  const radius=page.getByRole('slider',{name:'Circle radius'});await radius.focus();await page.keyboard.press('End');
  assert.equal(await radius.getAttribute('aria-valuenow'),'1.65');
  await page.getByRole('button',{name:'Pin comparison',exact:true}).click();await page.getByRole('button',{name:/Twice around/}).click();
  assert.equal(await page.getByRole('slider',{name:'Wave frequency'}).getAttribute('aria-valuenow'),'2');
  assert.equal(errors.length,0,JSON.stringify(errors));
  results.push({width,mode,theme,drag:{before,after},errors});console.log('PASS viewport and pointer',width,mode);
  await page.close();
 }
 await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}
