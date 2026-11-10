import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.MATH_PREVIEW_URL??'http://127.0.0.1:6027';await mkdir('.shots/math-catalog',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}});
 const response=await page.request.get(`${base}/index.json`);const index=await response.json();
 assert.ok(!Object.values(index.entries).some(e=>e.title.startsWith('Design OS/Math/')), 'Math must leave Design OS');
 const math=Object.values(index.entries).filter(e=>e.title.startsWith('Math/'));
 const titles=[...new Set(math.map(e=>e.title))].sort();
 assert.deepEqual(titles,['Calculator/Components/Wave Calculator','Explore/Components/Circle to Sine','Signals/Components/Signal Playground','Lab/Components/Solid Sections','Lab/Components/Complex Explorer','Lab/Components/Complex Series','Lab/Components/Prime Counting','Calculator/Components/Equation Input','Lab/Components/Mesh View','Signals/Components/Signal Surface','Signals/Components/Cross Section','Signals/Components/Drag Point','Cymatics/Components/Cymatics Explorer','Cymatics/Components/Standing String','Cymatics/Components/Cymatic Field','Perspective/Components/Projection Explorer','Perspective/Components/Optical Paths','Perspective/Components/Spatial Optics','Perspective/Components/Stereo Explorer','Perspective/Components/Projection View','Perspective/Components/Ray Path View','Perspective/Components/Stereo Pair','Stereo/Components/Stereo Illusion Lab','Stereo/Components/Dot Stereo View','Stereo/Components/Display Calibration','Stereo/Components/Fusion Targets','Stereo/Components/Motion Relief','Stereo/Components/Stereo Tuner','Stereo/Components/Stereogram'].map(t=>'Math/'+t).sort());
 console.log('PASS catalogue',titles.length,'groups',math.length,'entries');
 for(const suffix of ['explore-components-circle-to-sine--follow-one-turn','signals-components-signal-playground--explore-interference','lab-components-solid-sections--cut-topology','lab-components-complex-explorer--visit-zero','lab-components-mesh-view--reset-plane','signals-components-cross-section--switch-direction','signals-components-drag-point--keyboard']){
  const p=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{let channel;window.__plays=[];Object.defineProperty(window,'__STORYBOOK_ADDONS_CHANNEL__',{configurable:true,get:()=>channel,set:c=>{channel=c;for(const name of ['storyFinished','storyThrewException','playFunctionThrewException'])c.on(name,e=>window.__plays.push({name,status:e?.status,message:e?.message}));}});});
  await p.goto(`${base}/iframe.html?id=math-${suffix}&viewMode=story&globals=theme:linear;mode:dark`);
  await p.waitForFunction(()=>window.__plays.some(e=>e.name==='storyFinished'),{},{timeout:45000});const events=await p.evaluate(()=>window.__plays);assert.ok(events.every(e=>e.name==='storyFinished'&&e.status==='success'),JSON.stringify(events));assert.deepEqual(errors,[]);console.log('PASS play',suffix);await p.close();
 }
 for(const suffix of ['lab-components-mesh-view--plane-intersection','signals-components-signal-surface--signed-field','signals-components-cross-section--spatial-field','signals-components-drag-point--circle','lab-components-complex-series--phasor-series','lab-components-prime-counting--prime-count']){
  await page.goto(`${base}/iframe.html?id=math-${suffix}&viewMode=story&globals=theme:linear;mode:dark`);await page.locator('.zen-lab,.zen-signals').first().waitFor();
  if(suffix.includes('mesh-view')||suffix.includes('signal-surface'))await page.locator('[data-renderer-state="ready"]').waitFor();
  if(suffix.includes('drag-point'))await page.getByRole('group',{name:'Explore a point'}).waitFor();
  await page.screenshot({path:`.shots/math-catalog/${suffix}.png`,fullPage:true});console.log('PASS specimen',suffix);
 }
 await page.setViewportSize({width:390,height:900});await page.goto(`${base}/iframe.html?id=math-signals-components-cross-section--spatial-field&viewMode=story&globals=theme:linear;mode:light`);await page.getByRole('slider',{name:'Probe position'}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'.shots/math-catalog/narrow-section.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1100});await page.goto(`${base}/?path=/story/math-explore-components-circle-to-sine--playground`);await page.getByRole('link',{name:'Playground',exact:true}).waitFor();await page.frameLocator('#storybook-preview-iframe').locator('.zen-sine').waitFor();await page.getByText('Circle to Sine',{exact:true}).click();await page.getByText('Prime Counting',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'.shots/math-catalog/sidebar.png',fullPage:true});console.log('PASS sidebar + narrow layout');
}finally{await browser.close();}
