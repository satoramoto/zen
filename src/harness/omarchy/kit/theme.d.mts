export interface Theme {background:string;foreground:string;muted:string;accent:string;urgent:string;font:string;size:number;small:number;line:number;smallLine:number;gap:number;rowGap:number;padding:number;border:number;radius:number;control:number;selected?:string;normalFill?:string;selectedFill?:string;hoverFill?:string;normalBorder?:string;hoverBorder?:string;selectSize?:number;selectInset?:number;popupRow?:number;popupGap?:number;optionGap?:number;popupPad?:number;popupBorder?:string;hoverText?:string;selectionFill?:string}
export const dark:Theme;
export const light:Theme;
export function themeOf(value?:string|object):Theme;
