import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
const base=process.env.MATH_PREVIEW_URL??'http://127.0.0.1:6027',output='.shots/cymatics';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const url=s=>`${base}/iframe.html?id=math-cymatics-components-${s.replace(/^components-/,'')}&viewMode=story&globals=theme:linear;mode:dark`;
async function settle(p){await p.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))));}
function changed(a,b){const x=PNG.sync.read(a),y=PNG.sync.read(b);let count=0;assert.equal(x.data.length,y.data.length);for(let i=0;i<x.data.length;i+=4)if(Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+Math.abs(x.data[i+2]-y.data[i+2])>20)count++;return count;}
try{
 for(const story of ['chladni-pattern','square-membrane','drum-diameters','drum-rings','quadrature']){
  const p=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.goto(url(`cymatics-explorer--${story}`));await p.locator('[data-renderer-state="ready"]').waitFor();await settle(p);
  const field=p.locator('.zen-cymatics__field canvas'),surface=p.locator('.zen-lab__mesh canvas');const initial=await field.screenshot();await p.getByRole('button',{name:'Scatter grains'}).click();await settle(p);const scattered=await field.screenshot();assert.ok(changed(initial,scattered)>100,`${story}: scatter`);
  await p.getByRole('button',{name:'Play vibration'}).click();await p.waitForFunction(()=>Number(document.querySelector('[aria-label="Vibration cycle"]').value)>.15);await p.getByRole('button',{name:'Pause vibration'}).click();await field.scrollIntoViewIfNeeded();await settle(p);assert.ok(changed(scattered,await field.screenshot())>100,`${story}: grains`);
  await p.getByRole('button',{name:'Displacement',exact:true}).click();await settle(p);const geometry=await surface.screenshot();const slider=p.getByRole('slider',{name:'Vibration cycle'});await slider.focus();await slider.press('Home');await surface.scrollIntoViewIfNeeded();await settle(p);assert.ok(changed(geometry,await surface.screenshot())>100,`${story}: linked geometry`);
  const probe=p.getByRole('group',{name:'Inspect vibration at a point'});await probe.scrollIntoViewIfNeeded();const box=await probe.boundingBox(),before=await p.getByLabel('Probe RMS',{exact:true}).innerText();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+25,box.y+box.height/2-18,{steps:8});await p.mouse.up();assert.notEqual(await p.getByLabel('Probe RMS',{exact:true}).innerText(),before);
  await p.getByRole('button',{name:'Grains',exact:true}).click();await p.getByRole('button',{name:'Reset motion'}).click();await field.scrollIntoViewIfNeeded();await settle(p);await p.screenshot({path:`${output}/${story}.png`,fullPage:true});assert.deepEqual(errors,[]);console.log('PASS cymatic GPU + grains + probe',story);await p.close();
 }
 for(const suffix of ['cymatics-explorer--change-boundary','cymatics-explorer--scatter-and-play','standing-string--nodes-and-antinodes']){
  const p=await browser.newPage({viewport:{width:1280,height:1000}});await p.addInitScript(()=>{let channel;window.__plays=[];Object.defineProperty(window,'__STORYBOOK_ADDONS_CHANNEL__',{configurable:true,get:()=>channel,set:c=>{channel=c;for(const name of ['storyFinished','storyThrewException','playFunctionThrewException'])c.on(name,e=>window.__plays.push({name,status:e?.status,message:e?.message}));}});});await p.goto(url(suffix));await p.waitForFunction(()=>window.__plays.some(e=>e.name==='storyFinished'),{},{timeout:45000});const events=await p.evaluate(()=>window.__plays);assert.ok(events.every(e=>e.name==='storyFinished'&&e.status==='success'),JSON.stringify(events));console.log('PASS play',suffix);await p.close();
 }
 for(const [suffix,width] of [['standing-string--standing-mode',1440],['cymatics-explorer--chladni-pattern',390],['standing-string--standing-mode',390],['components-cymatic-field--nodal-grains',900]]){
  const p=await browser.newPage({viewport:{width,height:1000}});await p.goto(url(suffix).replace('mode:dark','mode:light'));await p.locator('.zen-lab').first().waitFor();if(suffix.startsWith('cymatics-explorer'))await p.locator('[data-renderer-state="ready"]').waitFor();else if(suffix.startsWith('standing'))await p.getByRole('group',{name:'Inspect the string'}).waitFor();await settle(p);await p.screenshot({path:`${output}/${suffix}-${width}.png`,fullPage:true});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));console.log('PASS layout',suffix,width);await p.close();
 }
}finally{await browser.close();}
