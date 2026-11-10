/** Total rotation is never normalized: only the derived endpoint is. Units are degrees. */
export function turnState(total: number, start = 0) {
  if (!Number.isFinite(total) || !Number.isFinite(start)) throw new RangeError('A turn must be finite');
  const endpoint = ((start + total) % 360 + 360) % 360;
  const laps = Math.floor(Math.abs(total) / 360);
  const direction = total < 0 ? 'clockwise' : total > 0 ? 'anticlockwise' : 'no turn';
  const axes: Record<number, string> = { 0: 'positive horizontal axis', 90: 'positive vertical axis', 180: 'negative horizontal axis', 270: 'negative vertical axis' };
  const region = axes[endpoint] ?? `quadrant ${['I', 'II', 'III', 'IV'][Math.floor(endpoint / 90)]}`;
  return { total, start, endpoint, laps, direction, region };
}

/** Unwrap the next pointer sample by its shortest signed displacement from the current end. */
export function continueTurn(total: number, pointerAngle: number, start = 0) {
  const current = turnState(total, start).endpoint;
  const next = turnState(pointerAngle).endpoint;
  return total + ((next - current + 540) % 360 - 180);
}
