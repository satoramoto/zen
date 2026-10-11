// A send's return level as shown: 0–127 in dB, as the old Effects drawer read it (64 = 0 dB,
// 127 = +6 dB, 0 = Off). The library's send list and story wrapper use it; the app's Effects
// wiring (panels/effects/model.ts) builds the editor's Return readout with it.

/** "Off", "-5.0 dB", "+0.0 dB", "+6.0 dB". */
export const returnText = (v: number): string => (v <= 0 ? 'Off' : `${v >= 64 ? '+' : ''}${(20 * Math.log10(v / 64)).toFixed(1)} dB`)
