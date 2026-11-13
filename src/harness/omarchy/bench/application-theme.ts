import {resolveTheme} from '../../../library/resolve';
import {dark,light} from '../kit/theme.mjs';
import type {Theme} from '../kit/theme.mjs';

// The browser has no Omarchy shell. Use its portable fallback palette there;
// a Linux browser host can pass the live shell snapshot. QML reads it live.
export function resolveApplicationTheme(name: string, native?: Theme) {
  if(name!=='omarchy')return resolveTheme({theme:'visuals'});
  const base=resolveTheme({theme:'linear',materials:'elektron'});
  const scheme=(mode:'dark'|'light',t:Theme)=>({
    ...base.facets.palette[mode],surface:[t.background,t.background,t.background,t.background] as [string,string,string,string],
    text:[t.foreground,t.foreground,t.muted,t.muted] as [string,string,string,string],
    border:t.muted,borderStrong:t.muted,accent:t.accent,action:t.foreground,actionText:t.background,
    selected:t.accent,selectedText:t.background,danger:t.urgent,
  });
  const font=(native || dark).font;
  return {...base,facets:{...base.facets,
    palette:{id:'omarchy',label:'Omarchy',dark:scheme('dark',native || dark),light:scheme('light',native || light)},
    faces:{...base.facets.faces,sans:font,display:font,mono:font},
    materials:{...base.facets.materials,radiusControl:`${native?.radius || 0}px`,radiusCard:'0px',radiusInput:`${native?.radius || 0}px`},
  }};
}
