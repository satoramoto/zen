import {useLayoutEffect,useRef} from 'react';
import {MovablePoint,type MovablePointProps} from 'mafs';

export function DragPoint({label,...props}:MovablePointProps & {label:string}) {
  const host=useRef<SVGGElement>(null);
  useLayoutEffect(()=>{
    const handle=host.current?.querySelector('.mafs-movable-point');
    handle?.setAttribute('role','group');handle?.setAttribute('aria-label',label);
    handle?.setAttribute('aria-description','Drag or use arrow keys. Labeled sliders are also available.');
  },[label]);
  return <g ref={host}><MovablePoint {...props}/></g>;
}
