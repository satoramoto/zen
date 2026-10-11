// The Channel header's CPU readout: the open part's average share of the audio buffer as a
// percentage, as the old mixer strips showed it (#340).

/** "0.4", "1.2", "12": a 0–1 share as a percentage, one decimal below 10%. */
export function cpuPercent(share: number): string {
  const p = Math.max(0, share) * 100
  // 9.96% rounds to 10, so it reads "10", not "10.0".
  return Math.round(p * 10) < 100 ? p.toFixed(1) : String(Math.round(p))
}
