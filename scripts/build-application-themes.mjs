// Resolve CSS theme tokens once for the Qt renderer (which has no CSS engine).
// Run from the Zen root: node scripts/build-application-themes.mjs [--check]
import {build} from 'esbuild';
import {chromium} from 'playwright';
import {readFileSync,writeFileSync} from 'node:fs';
const bundle=await build({stdin:{contents:`import {resolveTheme} from './src/library/resolve'; import {toCssVars} from './src/library/contract'; const {facets}=resolveTheme({theme:'visuals'}); window.inputs=['dark','light'].map(mode=>({mode,vars:toCssVars(facets,mode),font:facets.faces.sans,materials:facets.materials}));`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife'});
const browser=await chromium.launch();
let snapshots;
try {
  const page=await browser.newPage();await page.setContent('<div id="scope"><span id="sample"></span></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});
  snapshots=await page.evaluate(()=>{
    const scope=document.getElementById('scope'),sample=document.getElementById('sample');
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
    return Object.fromEntries(window.inputs.map(({mode,vars,font,materials})=>{
      for(const [name,value] of Object.entries(vars))scope.style.setProperty(name,value);
      const color=value=>{sample.style.color=value;const resolved=getComputedStyle(sample).color;ctx.clearRect(0,0,1,1);ctx.fillStyle=resolved;ctx.fillRect(0,0,1,1);const [r,g,b,a]=ctx.getImageData(0,0,1,1).data;return `#${[a,r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('')}`;};
      const variable=name=>color(`var(--${name})`);
      return [mode,{style:'visuals',background:variable('layer-ground-solid'),foreground:variable('text-1'),muted:variable('text-3'),accent:variable('accent'),urgent:variable('danger'),action:variable('action'),actionText:variable('action-text'),selected:variable('selected'),selectedText:variable('selected-text'),surfaceFill:variable('layer-raised-solid'),toolbarFill:variable('layer-float-solid'),surfaceBorder:variable('border'),normalFill:variable('surface-3'),normalBorder:variable('border-strong'),hoverFill:variable('surface-2'),font:font.split(',')[0].replaceAll("'",''),size:13,small:11,control:34,radius:parseFloat(materials.radiusCard),controlRadius:parseFloat(materials.radiusControl)}];
    }));
  });
} finally {await browser.close();}
const output='// Generated from resolveTheme({theme: "visuals"}); run scripts/build-application-themes.mjs.\nexport const visuals = '+JSON.stringify(snapshots,null,2)+';\n';
const path='src/harness/omarchy/kit/application-themes.mjs';
if(process.argv.includes('--check')) {if(readFileSync(path,'utf8')!==output)throw new Error('Native application theme tokens are stale');}
else writeFileSync(path,output);
