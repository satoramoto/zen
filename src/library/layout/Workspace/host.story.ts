// The stories' stand-in for an app's surface store: it owns the document and its history, applies
// every intent the Workspace sends with `applySurfaceIntent`, and keeps edit mode when asked to
// (`keepEditing`), the way mix's `SurfaceStore` does. Story harness only: zen ships no store; this
// shows the line between what the app keeps and what the surface keeps.
import { useCallback, useRef, useState } from 'react';
import { applySurfaceIntent, intentKind, type ApplyOptions } from './surface';
import type { SurfaceDocument, SurfaceIntent } from './Workspace.types';

export interface SurfaceHostOptions extends ApplyOptions {
  /** Keep edit mode in the host (the Workspace's `editing` prop) rather than leaving it to the surface. */
  keepEditing?: boolean;
  /** Edit mode the host starts in. */
  editing?: boolean;
}

export interface SurfaceHost {
  document: SurfaceDocument;
  canUndo: boolean;
  canRedo: boolean;
  /** Only when the host keeps it. */
  editing?: boolean;
  onIntent: (intent: SurfaceIntent) => void;
  /** Every intent received, oldest first: what the plays read. */
  intents: readonly SurfaceIntent[];
}

export function useSurfaceHost(initial: SurfaceDocument, { keepEditing = false, editing: start = false, ...apply }: SurfaceHostOptions = {}): SurfaceHost {
  const [state, setState] = useState({ past: [] as SurfaceDocument[], now: initial, future: [] as SurfaceDocument[] });
  const [editing, setEditing] = useState(start);
  const [intents, setIntents] = useState<readonly SurfaceIntent[]>([]);
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const onIntent = useCallback(
    (intent: SurfaceIntent) => {
      setIntents((all) => [...all, intent]);
      // What an app's store does with each kind of intent (`intentKind`): mode is kept apart from the
      // document, history walks the app's own stack, navigation changes the document without a
      // history entry, and only an edit is worth undoing.
      if (intent.type === 'setEditing') {
        if (keepEditing) setEditing(intent.editing);
        return;
      }
      setState(({ past, now, future }) => {
        if (intent.type === 'undo') return past.length ? { past: past.slice(0, -1), now: past[past.length - 1], future: [now, ...future] } : { past, now, future };
        if (intent.type === 'redo') return future.length ? { past: [...past, now], now: future[0], future: future.slice(1) } : { past, now, future };
        const next = applySurfaceIntent(now, intent, applyRef.current);
        if (next === now) return { past, now, future };
        if (intentKind(intent) === 'navigation') return { past, now: next, future };
        return { past: [...past, now], now: next, future: [] };
      });
    },
    [keepEditing],
  );
  return {
    document: state.now,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    editing: keepEditing ? editing : undefined,
    onIntent,
    intents,
  };
}
