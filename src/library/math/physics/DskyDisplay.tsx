import React from 'react';
import type { ApolloTelemetry } from './model/apolloDescent';
import './physics.css';

export interface DskyDisplayProps {
  readonly telemetry: ApolloTelemetry;
  readonly onTriggerAlarm?: () => void;
  readonly onResetAlarm?: () => void;
}

function formatReg(val: number, decimals: number = 0, sign: boolean = true): string {
  const rounded = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
  const prefix = sign ? (val >= 0 ? '+' : '-') : '';
  const numStr = Math.abs(Number(rounded)).toString().padStart(5, '0');
  return `${prefix}${numStr}`.slice(0, 6);
}

export const DskyDisplay: React.FC<DskyDisplayProps> = ({
  telemetry,
  onTriggerAlarm,
  onResetAlarm,
}) => {
  const isBraking = telemetry.program === 'P63';
  const isApproach = telemetry.program === 'P64';
  const isTerminal = telemetry.program === 'P66';

  // R1: horizontal speed or total speed
  const r1 = formatReg(telemetry.horizontalSpeed);
  // R2: vertical descent speed
  const r2 = formatReg(telemetry.verticalSpeed, 1);
  // R3: altitude in meters
  const r3 = formatReg(telemetry.altitude);

  return (
    <div className="zen-dsky" role="region" aria-label="Apollo Guidance Computer DSKY">
      <div className="zen-dsky__header">
        <span>APOLLO AGC</span>
        <span>DSKY · BLOCK II</span>
      </div>

      <div className="zen-dsky__annunciators">
        <div className={`zen-dsky__lamp ${telemetry.program ? 'zen-dsky__lamp--active' : ''}`}>
          COMP ACTY
        </div>
        <div className={`zen-dsky__lamp ${telemetry.alarm1202 ? 'zen-dsky__lamp--alarm' : ''}`}>
          1202 ALARM
        </div>
        <div className={`zen-dsky__lamp ${telemetry.contactLight ? 'zen-dsky__lamp--success' : ''}`}>
          CONTACT LT
        </div>
        <div className={`zen-dsky__lamp ${isTerminal ? 'zen-dsky__lamp--active' : ''}`}>
          ROD MODE
        </div>
      </div>

      <div className="zen-dsky__screen">
        <div className="zen-dsky__row">
          <div>
            <div className="zen-dsky__label">PROG</div>
            <div className="zen-dsky__digits zen-dsky__digits--amber">
              {telemetry.program.replace('P', '')}
            </div>
          </div>
          <div>
            <div className="zen-dsky__label">VERB</div>
            <div className="zen-dsky__digits">06</div>
          </div>
          <div>
            <div className="zen-dsky__label">NOUN</div>
            <div className="zen-dsky__digits">62</div>
          </div>
        </div>

        <div className="zen-dsky__registers">
          <div className="zen-dsky__reg">
            <span className="zen-dsky__label">R1 (H SPD)</span>
            <span className="zen-dsky__reg-val">{r1} <span style={{ fontSize: '0.65rem' }}>M/S</span></span>
          </div>
          <div className="zen-dsky__reg">
            <span className="zen-dsky__label">R2 (V SPD)</span>
            <span className="zen-dsky__reg-val">{r2} <span style={{ fontSize: '0.65rem' }}>M/S</span></span>
          </div>
          <div className="zen-dsky__reg">
            <span className="zen-dsky__label">R3 (ALT)</span>
            <span className="zen-dsky__reg-val">{r3} <span style={{ fontSize: '0.65rem' }}>M</span></span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        {telemetry.alarm1202 ? (
          <button
            type="button"
            className="zen-physics__btn"
            style={{ fontSize: '0.65rem', padding: '3px 6px' }}
            onClick={onResetAlarm}
          >
            ACK 1202 (KEY REL)
          </button>
        ) : (
          <button
            type="button"
            className="zen-physics__btn zen-physics__btn--alarm"
            style={{ fontSize: '0.65rem', padding: '3px 6px' }}
            onClick={onTriggerAlarm}
          >
            TEST 1202 OVERFLOW
          </button>
        )}
      </div>
    </div>
  );
};
