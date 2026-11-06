// Real WebGL and Storybook evidence. Requires the unified preview launcher.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
const base=process.env.MATH_PREVIEW_URL??'http://127.0.0.1:6027';
const output=process.env.SIGNAL_ARTIFACTS??'.shots/signals';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const prefix='design-os-math-signals-spaces--';
const cases=[['traveling-wave','Turn 90°'],['interference','Cancel'],['standing-wave','One traveler'],['fourier-synthesis','Twelve harmonics'],['beats','Many beats'],['amplitude-modulation','Bare carrier'],['dispersion','Localize it'],['phase-torus','Irrational ratio'],['spherical-mode','Four lobes'],['four-dimensional-projection','Mix the dimensions']];
const reports=[];
function observe(){
 const events=window.__signalEvents=[];let channel;
 Object.defineProperty(window,'__STORYBOOK_ADDONS_CHANNEL__',{configurable:true,get:()=>channel,set:value=>{channel=value;for(const name of ['storyFinished','storyThrewException','storyErrored','playFunctionThrewException'])value.on(name,event=>events.push({name,status:event?.status,message:event?.message}));}});
}
const url=(story,mode='dark')=>`${base}/iframe.html?id=${prefix}${story}&viewMode=story&globals=theme:linear;mode:${mode}`;
async function settle(page){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))));}
function changed(a,b){const x=PNG.sync.read(a),y=PNG.sync.read(b);assert.equal(x.data.length,y.data.length);let count=0;for(let i=0;i<x.data.length;i+=4)if(Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+Math.abs(x.data[i+2]-y.data[i+2])>15)count++;return count;}
try{
 for(const [story,experiment] of cases){
  const page=await browser.newPage({viewport:{width:1440,height:1100},colorScheme:'dark'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,600));});
  await page.goto(url(story));await page.locator('[data-renderer-state="ready"]').waitFor({timeout:45000});await settle(page);
  const canvas=page.locator('.zen-signal-surface canvas');const before=await canvas.screenshot();
  await page.screenshot({path:`${output}/${story}.png`,fullPage:true});
  await page.getByRole('button',{name:experiment,exact:true}).click();await settle(page);
  const after=await canvas.screenshot();const pixels=changed(before,after);assert.ok(pixels>100,`${story}: experiment did not change rendered geometry (${pixels})`);
  // Drag the mathematical parameter pad, not the camera, and observe actual quantity changes.
  const pad=page.locator('.zen-signals__pad .mafs-movable-point-point');const bounds=await pad.boundingBox();
  const readouts=await page.locator('.zen-signals__readouts').innerText();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+22,bounds.y+bounds.height/2-20,{steps:8});await page.mouse.up();
  assert.notEqual(await page.locator('.zen-signals__readouts').innerText(),readouts,`${story}: pad did not change quantities`);
  await page.getByRole('button',{name:'top',exact:true}).click();await settle(page);assert.ok(changed(after,await canvas.screenshot())>100,`${story}: camera did not change view`);
  if(story!=='four-dimensional-projection'){
   const paused=await canvas.screenshot();await page.getByRole('button',{name:'Play signal'}).click();await page.waitForFunction(()=>Number(document.querySelector('[aria-label="Signal time"]').value)>.7);await page.getByRole('button',{name:'Pause signal'}).click();await settle(page);assert.ok(changed(paused,await canvas.screenshot())>100,`${story}: playback did not change the drawing`);
  }
  assert.deepEqual(errors,[],`${story}: console errors`);reports.push({story,experiment,changedPixels:pixels,errors});console.log('PASS GPU + interactions',story,pixels);await page.close();
 }
 for(const story of ['explore-interference','switch-dimensions']){
  const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(observe);await page.goto(url(story));
  await page.waitForFunction(()=>window.__signalEvents?.some(e=>e.name==='storyFinished'),{},{timeout:45000});const events=await page.evaluate(()=>window.__signalEvents);
  assert.ok(events.every(e=>e.name==='storyFinished'&&e.status==='success'),JSON.stringify(events));assert.deepEqual(errors,[]);reports.push({story,events});console.log('PASS play',story);await page.close();
 }
 for(const [width,mode,story] of [[900,'light','interference'],[560,'dark','phase-torus'],[390,'light','four-dimensional-projection']]){
  const page=await browser.newPage({viewport:{width,height:1000},colorScheme:mode,reducedMotion:'reduce'});await page.goto(url(story,mode));await page.locator('[data-renderer-state="ready"]').waitFor();await settle(page);await page.screenshot({path:`${output}/${width}-${mode}.png`,fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);reports.push({width,mode,story});console.log('PASS viewport',width);await page.close();
 }
 await writeFile(`${output}/results.json`,JSON.stringify(reports,null,2));
}finally{await browser.close();}
