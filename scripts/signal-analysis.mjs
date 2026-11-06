import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
const base=process.env.MATH_PREVIEW_URL??'http://127.0.0.1:6027';
const output=process.env.SIGNAL_ARTIFACTS??'.shots/analysis';await mkdir(output,{recursive:true});
function changed(a,b){const x=PNG.sync.read(a),y=PNG.sync.read(b);assert.equal(x.data.length,y.data.length);let n=0;for(let i=0;i<x.data.length;i+=4)if(Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+Math.abs(x.data[i+2]-y.data[i+2])>20)n++;return n;}
async function settle(page){await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))));}
const browser=await chromium.launch({headless:true});
try{
 for(const [story,width,mode] of [['interference',1440,'dark'],['spherical-mode',1440,'dark'],['phase-torus',1440,'light'],['four-dimensional-projection',390,'light']]){
  const page=await browser.newPage({viewport:{width,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`${base}/iframe.html?id=design-os-math-signals-spaces--${story}&viewMode=story&globals=theme:linear;mode:${mode}`);
  await page.locator('[data-renderer-state="ready"]').waitFor();await settle(page);
  const canvas=page.locator('.zen-signal-surface canvas');const solid=await canvas.screenshot();
  await page.getByRole('button',{name:'Signed value',exact:true}).click();await settle(page);const signed=await canvas.screenshot();assert.ok(changed(solid,signed)>1000,`${story}: signed color did not change`);
  await page.getByRole('button',{name:'Magnitude',exact:true}).click();await settle(page);assert.ok(changed(signed,await canvas.screenshot())>1000,`${story}: magnitude did not change`);
  await page.getByRole('button',{name:'Signed value',exact:true}).click();
  await page.getByRole('button',{name:story==='interference'?'Along z':'Along v',exact:true}).click();
  const cut=page.getByRole('slider',{name:'Section position'});await cut.focus();await cut.press('ArrowRight');assert.notEqual(await cut.inputValue(),'0');
  const locator=page.locator('.zen-signals__locator .mafs-movable-point-point');await locator.scrollIntoViewIfNeeded();const box=await locator.boundingBox();const previous=await cut.inputValue();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+18,box.y+box.height/2-16,{steps:6});await page.mouse.up();assert.notEqual(await cut.inputValue(),previous,`${story}: navigator did not move section`);
  const probe=page.getByRole('slider',{name:'Probe position'});const beforeProbe=await probe.inputValue();const handle=page.locator('.zen-signals__trace .mafs-movable-point-point');await handle.scrollIntoViewIfNeeded();const pb=await handle.boundingBox();await page.mouse.move(pb.x+pb.width/2,pb.y+pb.height/2);await page.mouse.down();await page.mouse.move(pb.x+pb.width/2+25,pb.y+pb.height/2,{steps:6});await page.mouse.up();assert.notEqual(await probe.inputValue(),beforeProbe,`${story}: trace probe did not move`);
  await page.getByRole('button',{name:'Pin 2D comparison',exact:true}).click();await cut.focus();await cut.press('ArrowRight');assert.ok(await page.getByText(/Dashed: frozen section/).isVisible());
  await page.getByRole('button',{name:story==='interference'?'Along x':'Along u',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Pin 2D comparison',exact:true}).getAttribute('aria-pressed'),'false');
  await canvas.scrollIntoViewIfNeeded();await settle(page);await page.screenshot({path:`${output}/${story}-${width}.png`,fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS gradients, section directions, direct navigation, linked probe, pinning, layout',story,width);await page.close();
 }
 const page=await browser.newPage();await page.addInitScript(()=>{let channel;window.__plays=[];Object.defineProperty(window,'__STORYBOOK_ADDONS_CHANNEL__',{configurable:true,get:()=>channel,set:c=>{channel=c;for(const name of ['storyFinished','storyThrewException','playFunctionThrewException'])c.on(name,event=>window.__plays.push({name,status:event?.status}));}});});
 await page.goto(`${base}/iframe.html?id=design-os-math-signals-spaces--cross-section-analysis&viewMode=story`);await page.waitForFunction(()=>window.__plays.some(e=>e.name==='storyFinished'),{},{timeout:45000});assert.ok((await page.evaluate(()=>window.__plays)).every(e=>e.name==='storyFinished'&&e.status==='success'));console.log('PASS cross-section Storybook play');
}finally{await browser.close();}
