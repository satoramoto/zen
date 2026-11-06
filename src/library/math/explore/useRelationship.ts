import { useCallback, useMemo, useState } from 'react';
import { quantityValue, relationshipSources, type Relationship } from './relationship';

/** Shared state for linked representations, with a stable comparison snapshot. */
export function useRelationship<K extends string, D>(definition: Relationship<K, D>, initial?: Partial<Record<K, number>>) {
  const [sources, setSources] = useState(() => relationshipSources(definition, initial));
  const [pinned, setPinned] = useState<Record<K, number> | null>(null);
  const set = useCallback((key: K, value: number | ((previous: number) => number)) => {
    setSources(previous => ({ ...previous, [key]: quantityValue(definition.quantities[key], typeof value === 'function' ? value(previous[key]) : value) }));
  }, [definition]);
  const restore = useCallback((next?: Partial<Record<K, number>>) => setSources(relationshipSources(definition, next)), [definition]);
  const values = useMemo(() => definition.derive(sources), [definition, sources]);
  return { sources, values, set, restore, pinned, pin: () => setPinned({ ...sources }), unpin: () => setPinned(null) };
}
