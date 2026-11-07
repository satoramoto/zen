// Complex numbers as little arrows: what a Fourier series adds tip to tail.

export interface Complex {
  re: number;
  im: number;
}

export const C = (re: number, im = 0): Complex => ({ re, im });
export const ZERO: Complex = { re: 0, im: 0 };
export const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const sub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
export const mul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const scale = (a: Complex, k: number): Complex => ({ re: a.re * k, im: a.im * k });
export const conj = (a: Complex): Complex => ({ re: a.re, im: -a.im });
export const abs = (a: Complex): number => Math.hypot(a.re, a.im);
/** The angle, in radians, from the positive real axis. */
export const arg = (a: Complex): number => Math.atan2(a.im, a.re);
/** `e^{iθ}`: the point on the unit circle at angle θ. */
export const cis = (theta: number): Complex => ({ re: Math.cos(theta), im: Math.sin(theta) });
/** A complex number from its size and angle. */
export const polar = (r: number, theta: number): Complex => scale(cis(theta), r);
/** `e^{n · 2πi · t}`: the unit arrow after `n` turns per unit of time, at time `t`. */
export const turn = (n: number, t: number): Complex => cis(n * 2 * Math.PI * t);
