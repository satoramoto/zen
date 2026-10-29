import { keyed, stores, type Stores } from '../../view/stores';

interface HostParams { given: number | boolean; onGiven?(value: number | boolean): void }
/** Remember external Controls changes, including a later return to the initial value. */
export function bindPressableHost(_node: HTMLElement, initial: HostParams) {
  let given = initial.given;
  return {
    update(next: HostParams) {
      if (given === next.given) return;
      given = next.given;
      next.onGiven?.(given);
    },
  };
}

/** Story-only store; inherit the production registry rather than registering a story helper. */
export const pressableHostStores: Stores = Object.assign(Object.create(stores), {
  musicPressableHost: keyed(bindPressableHost, ['onGiven']),
});
