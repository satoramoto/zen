import { bindMomentary, type MomentaryParams } from '../mixer/Momentary.input';

/** A spring-return toggle also releases when dragged off its original face. */
export function bindToggleMomentary(node: HTMLElement, initial: MomentaryParams) {
  let params = initial;
  let held = false;
  const adapt = (): MomentaryParams => ({
    disabled: params.disabled,
    onHold(next) { held = next; params.onHold?.(next); },
  });
  const binding = bindMomentary(node, adapt());
  const leave = () => { if (held) node.dispatchEvent(new Event('pointercancel')); };
  node.addEventListener('pointerleave', leave);
  return {
    update(next: MomentaryParams) { params = next; binding.update(adapt()); },
    destroy() { node.removeEventListener('pointerleave', leave); binding.destroy(); },
  };
}
