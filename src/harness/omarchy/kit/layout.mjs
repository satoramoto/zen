// A bounded layout language, not two approximations of flexbox. Integer geometry
// and explicit monospace line breaks are shared by Qt and the browser.
import {themeOf} from './theme.mjs';
export function lines(label, width, size) {
  const count = Math.max(1, Math.floor(width / (size * 0.6)));
  const result = [];
  String(label || '').split('\n').forEach(paragraph => {
    if (!paragraph.length) { result.push(''); return; }
    while (paragraph.length > count) {
      let cut = paragraph.lastIndexOf(' ', count);
      if (cut < 1) cut = count;
      result.push(paragraph.substring(0, cut));
      paragraph = paragraph.substring(cut).replace(/^ +/, '');
    }
    if (paragraph.length) result.push(paragraph);
  });
  return result;
}
function natural(node, t) {
  if (node.kind === 'button') return Math.ceil(String(node.label || '').length * t.size * 0.6) + 24;
  if (node.kind === 'text') return Math.max(100, Math.ceil(String(node.label || '').length * t.size * 0.6));
  return 180;
}
export function arrange(node, width, theme) {
  const t = themeOf(theme), w = Math.max(1, Math.floor(width));
  const box = {x:0, y:0, width:w, height:0, children:[]};
  if (node.kind === 'column' || node.kind === 'section') {
    let y = node.kind === 'section' ? 14 + t.smallLine + t.gap : 0;
    (node.children || []).forEach(child => {
      const b = arrange(child, w, t); b.y = y; box.children.push(b); y += b.height + t.gap;
    });
    box.height = Math.max(0, y - ((node.children || []).length ? t.gap : 0)) + (node.kind === 'section' ? 12 : 0);
  } else if (node.kind === 'row') {
    const kids = node.children || [];
    const fixed = kids.reduce((sum, n) => sum + (n.grow ? 0 : Math.min(w, natural(n,t))), 0);
    const growers = kids.filter(n => n.grow).length;
    const free = Math.max(100, Math.floor((w - fixed - (kids.length - 1) * t.rowGap) / Math.max(1,growers)));
    let x=0, y=0, rowHeight=0, row=[];
    const finish = () => { row.forEach(b => { b.y = y + Math.floor((rowHeight-b.height)/2); }); y += rowHeight + t.rowGap; row=[]; rowHeight=0; x=0; };
    kids.forEach(child => {
      const cw = Math.min(w, child.grow ? free : natural(child,t));
      if (x && x + cw > w) finish();
      const b = arrange(child,cw,t); b.x=x; box.children.push(b); row.push(b); rowHeight=Math.max(rowHeight,b.height); x+=cw+t.rowGap;
    });
    if (row.length) finish();
    box.height=Math.max(0,y-t.rowGap);
  } else if (node.kind === 'text') {
    box.lines=lines(node.label,w,t.size); box.detailLines=node.detail ? lines(node.detail,w,t.small) : [];
    box.height=box.lines.length*t.line+(box.detailLines.length ? 2+box.detailLines.length*t.smallLine : 0);
  } else if (node.kind === 'slider') {
    box.labelLines=lines(node.label,w,t.small); box.controlY=box.labelLines.length*t.smallLine+4;
    box.height=box.controlY+t.control;
  } else if (node.kind === 'toggle') {
    box.labelLines=lines(node.label,w-62,t.size); box.height=Math.max(t.control,box.labelLines.length*t.line+12);
  } else if (node.kind === 'select' || node.kind === 'input') {
    box.labelLines=lines(node.label,w,t.small); box.controlY=box.labelLines.length*t.smallLine+4;
    box.height=box.controlY+t.control;
  } else box.height=t.control;
  return box;
}
