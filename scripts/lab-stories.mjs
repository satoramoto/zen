import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
const base=process.env.MATH_PREVIEW_URL??'http://127.0.0.1:6027',output='.shots/lab';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const group=story=>['sphere-cuts','torus-cuts','ellipsoid-cuts','cut-topology'].includes(story)?'solid-sections':story==='phasor-series'?'complex-series':story==='prime-count'?'prime-counting':'complex-explorer';
const url=(s,mode='dark')=>`${base}/iframe.html?id=design-os-math-${group(s)}--${s}&viewMode=story&globals=theme:linear;mode:${mode}`;
function changed(a,b){const x=PNG.sync.read(a),y=PNG.sync.read(b);assert.equal(x.data.length,y.data.length);let n=0;for(let i=0;i<x.data.length;i+=4)if(Math.abs(x.data[i]-y.data[i])+Math.abs(x.data[i+1]-y.data[i+1])+Math.abs(x.data[i+2]-y.data[i+2])>20)n++;return n;}
async function settle(p){await p.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(done)))));}
try{
 for(const story of ['sphere-cuts','torus-cuts','ellipsoid-cuts','complex-square','complex-reciprocal','riemann-zeta']){
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto(url(story));await page.locator('[data-renderer-state="ready"]').waitFor({timeout:45000});await settle(page);
  const canvas=page.locator('.zen-lab__mesh canvas'),before=await canvas.screenshot();
  if(story.endsWith('cuts')){
   await page.getByRole('button',{name:'Two separate disks'}).click();await settle(page);assert.equal(await page.getByLabel('Boundary loops').innerText(),'2');assert.ok(changed(before,await canvas.screenshot())>100);
   await page.getByRole('checkbox',{name:'Hide one side'}).check();await settle(page);
   const pad=page.getByRole('group',{name:'Tilt and offset the cutting plane'});await pad.scrollIntoViewIfNeeded();const box=await pad.boundingBox();const prior=await page.getByRole('slider',{name:'Plane offset'}).inputValue();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+15,box.y+box.height/2-20,{steps:8});await page.mouse.up();assert.notEqual(await page.getByRole('slider',{name:'Plane offset'}).inputValue(),prior);
  }else{
   const pad=page.getByRole('group',{name:'Complex input',exact:true});await pad.scrollIntoViewIfNeeded();const box=await pad.boundingBox();const prior=await page.getByLabel('Complex input value').innerText();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+20,box.y+box.height/2-18,{steps:8});await page.mouse.up();assert.notEqual(await page.getByLabel('Complex input value').innerText(),prior);
   await page.getByRole('button',{name:'real',exact:true}).click();await settle(page);assert.ok(changed(before,await canvas.screenshot())>100);
   if(story==='riemann-zeta'){const domain=page.locator('.zen-lab__domain canvas'),plain=await domain.screenshot();await page.getByRole('checkbox',{name:/Show zero contours/}).check();await settle(page);assert.ok(changed(plain,await domain.screenshot())>100);await page.getByRole('button',{name:/Zero 2/}).click();assert.ok(Number(await page.getByLabel('Output magnitude').innerText())<1e-10);await page.getByRole('button',{name:'Move to σ = 0.7'}).click();assert.ok(Number(await page.getByLabel('Output magnitude').innerText())>.01);}
   await page.getByRole('button',{name:'Sweep the line'}).click();const start=await page.getByRole('slider',{name:'Imaginary input'}).inputValue();await page.waitForFunction(v=>document.querySelector('[aria-label="Imaginary input"]').value!==v,start);await page.getByRole('button',{name:'Pause sweep'}).click();
  }
  await canvas.scrollIntoViewIfNeeded();await settle(page);await page.screenshot({path:`${output}/${story}.png`,fullPage:true});assert.deepEqual(errors,[]);console.log('PASS GPU + interactions',story);await page.close();
 }
 {
  const p=await browser.newPage({viewport:{width:1440,height:1100}});await p.goto(url('torus-cuts'));await p.locator('[data-renderer-state="ready"]').waitFor();const canvas=p.locator('.zen-lab__mesh canvas');
  for(const rotate of [false,true]){if(rotate)await p.getByRole('button',{name:'Rotate plane',exact:true}).click();await canvas.scrollIntoViewIfNeeded();const img=PNG.sync.read(await canvas.screenshot()),hits=[];
   for(let y=20;y<img.height-20;y++)for(let x=20;x<img.width-20;x++){const i=(y*img.width+x)*4,r=img.data[i],g=img.data[i+1],b=img.data[i+2];if(rotate?r>180&&g<60&&b<60:b>180&&r<60&&g<60)hits.push([x,y]);}
   assert.ok(hits.length>3);const hit=hits[Math.floor(hits.length*.3)],box=await canvas.boundingBox(),control=p.getByRole('slider',{name:rotate?'Plane tilt':'Plane offset'}),before=await control.inputValue();
   await p.mouse.move(box.x+hit[0],box.y+hit[1]);await p.mouse.down();await p.mouse.move(box.x+hit[0]+25,box.y+hit[1]-30,{steps:12});await p.mouse.up();assert.notEqual(await control.inputValue(),before);console.log('PASS native 3D handle',rotate?'rotate':'translate');
  }await p.close();
 }
 for(const story of ['phasor-series','prime-count']){
  const p=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url(story));
  if(story==='phasor-series'){await p.getByRole('button',{name:'All arrows align'}).click();const before=await p.getByLabel('Series error').innerText();const slider=p.getByRole('slider',{name:'Series terms'});await slider.focus();await slider.press('End');assert.notEqual(await p.getByLabel('Series error').innerText(),before);}
  else{await p.getByRole('slider',{name:'Prime inspection point'}).focus();await p.getByRole('slider',{name:'Prime inspection point'}).press('End');assert.equal(await p.getByLabel('Prime count',{exact:true}).innerText(),'46');await p.getByRole('button',{name:'Range to 1000'}).click();assert.equal(await p.getByLabel('Prime count',{exact:true}).innerText(),'25');}
  await p.screenshot({path:`${output}/${story}.png`,fullPage:true});await p.setViewportSize({width:390,height:900});await settle(p);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log('PASS supporting primitive',story);await p.close();
 }
 for(const story of ['cut-topology','visit-zero']){
  const p=await browser.newPage();await p.addInitScript(()=>{let channel;window.__plays=[];Object.defineProperty(window,'__STORYBOOK_ADDONS_CHANNEL__',{configurable:true,get:()=>channel,set:c=>{channel=c;for(const name of ['storyFinished','storyThrewException','playFunctionThrewException'])c.on(name,e=>window.__plays.push({name,status:e?.status,message:e?.message}));}});});await p.goto(url(story));await p.waitForFunction(()=>window.__plays.some(e=>e.name==='storyFinished'),{},{timeout:45000});const events=await p.evaluate(()=>window.__plays);assert.ok(events.every(e=>e.name==='storyFinished'&&e.status==='success'),JSON.stringify(events));console.log('PASS play',story);await p.close();
 }
 for(const story of ['torus-cuts','riemann-zeta']){const p=await browser.newPage({viewport:{width:390,height:900}});await p.goto(url(story,'light'));await p.locator('[data-renderer-state="ready"]').waitFor();await settle(p);await p.screenshot({path:`${output}/${story}-390.png`,fullPage:true});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));console.log('PASS narrow',story);await p.close();}
}finally{await browser.close();}
