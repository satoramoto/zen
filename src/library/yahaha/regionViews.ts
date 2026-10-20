// A stopgap for React's `Region`, which takes its views as `Region.View` children while
// `Region.svelte` (and so a tree's `component('Region', { views, … })` node) takes them as a `views`
// prop. `withRegionViews` is the React component registry with `Region` drawn from `views`: each
// view a `Region.View` holding the region's children. Remove it once `Region.tsx` takes `views`.
import { createElement, type ComponentType, type ReactNode } from 'react';
import { Region, type RegionProps, type RegionViewProps } from '../layout/Region';
import { reactComponent } from '../view/reactComponents';

type ViewsRegionProps = Omit<RegionProps, 'children'> & { views?: Omit<RegionViewProps, 'children'>[]; children?: ReactNode };

function ViewsRegion({ views = [], children, ...props }: ViewsRegionProps) {
  if (views.length === 0) return createElement(Region, props, children);
  return createElement(
    Region,
    props,
    views.map((v) => createElement(Region.View, { ...v, key: v.id }, children)),
  );
}

/** The React component registry, with `Region` taking its views as a `views` prop. */
export function withRegionViews(name: string): ComponentType<any> {
  return name === 'Region' ? ViewsRegion : reactComponent(name);
}
