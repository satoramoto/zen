import { describe, expect, it } from 'vitest';
import {
  apolloGuidanceLaw,
  ApolloDescentState,
  getApolloTelemetry,
  INITIAL_APOLLO_11_DESCENT_STATE,
  stepApolloDescent,
} from './apolloDescent';
import { vec2 } from './vector2';

describe('Apollo 11 descent simulation model', () => {
  it('initializes with accurate Apollo 11 perilune parameters', () => {
    const s0 = INITIAL_APOLLO_11_DESCENT_STATE;
    expect(s0.program).toBe('P63');
    expect(s0.pos.y).toBe(15240); // 50,000 ft altitude
    expect(s0.vel.x).toBe(1680); // orbital speed
    expect(s0.throttle).toBe(0.99); // Full throttle
    const telem = getApolloTelemetry(s0);
    expect(telem.altitude).toBe(15240);
    expect(telem.alarm1202).toBe(false);
    expect(telem.contactLight).toBe(false);
  });

  it('computes Cherry-Klumpp Apollo guidance acceleration', () => {
    // Spacecraft overshooting target: moving forward fast (100 m/s), 1000m out, 20s to go
    const currentPos = vec2(-1000, 500);
    const currentVel = vec2(100, -10);
    const targetPos = vec2(0, 0);
    const targetVel = vec2(0, 0);
    const tGo = 20;

    const aCmd = apolloGuidanceLaw(currentPos, currentVel, targetPos, targetVel, tGo);
    // Should command deceleration in X (aCmd.x < 0) to arrest forward flight
    expect(aCmd.x).toBeLessThan(0);
  });

  it('transitions properly through P63 to P64 approach', () => {
    // Start at High Gate entry conditions
    let state = {
      ...INITIAL_APOLLO_11_DESCENT_STATE,
      pos: vec2(-5000, 2350),
      vel: vec2(150, -25),
      propellantMass: 3000,
      pitchAngle: (120 * Math.PI) / 180,
    };

    // Step a few seconds
    for (let i = 0; i < 20; i++) {
      state = stepApolloDescent(state, undefined, 0.2);
    }

    // Should transition to P64
    expect(state.program).toBe('P64');
    expect(state.flightStatus).toBe('APPROACH');
  });

  it('handles terminal landing and soft touchdown in P66', () => {
    // Near lunar surface in P66 with gentle descent
    let state: ApolloDescentState = {
      ...INITIAL_APOLLO_11_DESCENT_STATE,
      program: 'P66',
      flightStatus: 'TERMINAL_ROD',
      pos: vec2(0, 5), // 5 meters high
      vel: vec2(0.1, -0.8), // gentle -0.8 m/s descent
      propellantMass: 500,
      pitchAngle: Math.PI / 2, // upright
      commandedROD: -0.8,
    };

    while (state.pos.y > 0) {
      state = stepApolloDescent(state, undefined, 0.1);
    }

    expect(state.pos.y).toBe(0);
    expect(state.flightStatus).toBe('TOUCHDOWN_SUCCESS');
    const telem = getApolloTelemetry(state);
    expect(telem.contactLight).toBe(true);
  });
});
