import { h, wire, type Node } from '../../view/Tree.model';

/** The lifecycle store fills the path and its dial-sized mask after layout. */
export function stemConnectionsView(): Node {
  return wire(h('svg', { class: 'play-stem-connections', 'aria-hidden': 'true' },
    h('defs', {}, h('mask', {}, h('rect', { width: '100%', height: '100%', fill: 'white' }))),
    h('path', { d: '', fill: 'none', stroke: 'currentColor', 'stroke-width': '1' }),
  ), { bind: [['musicStemConnections', {}]] });
}
