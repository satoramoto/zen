/** Source dial geometry: a 270-degree sweep, cropped without scaling the anatomy. */
export const DIAL_CENTER = 20;
export const DIAL_RADIUS = 15;
export const DIAL_START = -135;
export const DIAL_END = 135;
export const DIAL_VIEWBOX_TOP = 2;
export const DIAL_VIEWBOX_HEIGHT = 32;
export function dialAngle(fraction: number): number { return DIAL_START + fraction * (DIAL_END - DIAL_START); }
export function dialPoint(degrees: number, radius = DIAL_RADIUS): [number, number] {
  const radians = (degrees * Math.PI) / 180;
  return [DIAL_CENTER + radius * Math.sin(radians), DIAL_CENTER - radius * Math.cos(radians)];
}
export function dialArc(fromDegrees: number, toDegrees: number): string | null {
  if (Math.abs(toDegrees - fromDegrees) < 0.5) return null;
  const [x0, y0] = dialPoint(fromDegrees);
  const [x1, y1] = dialPoint(toDegrees);
  const large = Math.abs(toDegrees - fromDegrees) > 180 ? 1 : 0;
  const sweep = toDegrees >= fromDegrees ? 1 : 0;
  return `M ${x0} ${y0} A ${DIAL_RADIUS} ${DIAL_RADIUS} 0 ${large} ${sweep} ${x1} ${y1}`;
}
