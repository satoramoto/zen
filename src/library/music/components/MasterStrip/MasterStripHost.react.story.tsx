import { useMemo, useSyncExternalStore } from 'react';
import { MasterStrip } from './MasterStrip';
import type { MasterStripProps } from './MasterStrip.model';
import { createMasterStripHost } from './MasterStripHost.story';

/** Only the host is a harness: the actual production binding and default registry draw the face. */
export function MasterStripHost(props: MasterStripProps) {
  const host = useMemo(() => createMasterStripHost(props.state, props.commands), [props.state, props.commands]);
  const state = useSyncExternalStore(host.subscribe, host.getSnapshot, host.getSnapshot);
  return <MasterStrip {...props} state={state} commands={host.commands} />;
}
