import { describe, expect, it } from 'vitest';
import {
  G0,
  massFlowRate,
  stepRocket,
  tsiolkovskyDeltaV,
  type RocketConfig,
  type RocketState,
} from './rocket';

describe('rocket physics and variable mass', () => {
  it('calculates ideal Tsiolkovsky delta-v', () => {
    // Apollo 11 Lunar Module descent stage approx:
    // Initial mass ~ 15,100 kg, Final mass ~ 6,900 kg, Isp ~ 311s
    const dv = tsiolkovskyDeltaV(15100, 6900, 311);
    // ~2388 m/s
    expect(dv).toBeGreaterThan(2300);
    expect(dv).toBeLessThan(2500);
  });

  it('depletes propellant accurately over time', () => {
    const config: RocketConfig = {
      dryMass: 4000,
      initialPropellantMass: 1000,
      isp: 300,
      maxThrust: 30000, // 30 kN
      momentOfInertia: 10000,
      rcsTorque: 500,
    };

    const state: RocketState = {
      propellantMass: 1000,
      pitchAngle: 0,
      pitchRate: 0,
      throttle: 1.0,
      rcsCommand: 0,
    };

    const expectedMDot = 30000 / (300 * G0); // ~10.197 kg/s
    expect(massFlowRate(30000, 300)).toBeCloseTo(expectedMDot, 3);

    const step = stepRocket(config, state, 10); // 10 seconds of burn
    expect(step.nextState.propellantMass).toBeCloseTo(1000 - expectedMDot * 10, 1);
    expect(step.thrustMag).toBe(30000);
    expect(step.thrustForce.x).toBeCloseTo(30000);
    expect(step.thrustForce.y).toBeCloseTo(0);
  });

  it('stops producing thrust when fuel is exhausted', () => {
    const config: RocketConfig = {
      dryMass: 2000,
      initialPropellantMass: 5,
      isp: 300,
      maxThrust: 10000,
      momentOfInertia: 5000,
      rcsTorque: 200,
    };

    const state: RocketState = {
      propellantMass: 0,
      pitchAngle: 0,
      pitchRate: 0,
      throttle: 1.0,
      rcsCommand: 0,
    };

    const step = stepRocket(config, state, 1.0);
    expect(step.thrustMag).toBe(0);
    expect(step.thrustForce.x).toBe(0);
  });
});
