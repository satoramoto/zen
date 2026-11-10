import { NOUNS, readRegister, registers, type DskyKey, type DskyState } from '../../model/dsky';
import type { DskyReadout } from '../../model/lunarDescent';
import '../../physics.css';

export interface DskyProps {
  dsky: DskyState;
  readout: DskyReadout;
  /** A key pressed. */
  onKey(key: DskyKey): void;
}

const pad = (n: number) => String(n).padStart(2, '0');
const LAMPS: { key: 'compActy' | 'keyRel' | 'oprErr' | 'prog'; id: string; name: string }[] = [
  { key: 'compActy', id: 'comp-acty', name: 'COMP ACTY' },
  { key: 'keyRel', id: 'key-rel', name: 'KEY REL' },
  { key: 'oprErr', id: 'opr-err', name: 'OPR ERR' },
  { key: 'prog', id: 'prog', name: 'PROG' },
];
const KEYS: DskyKey[][] = [
  ['VERB', '7', '8', '9', 'CLR'],
  ['NOUN', '4', '5', '6', 'PRO'],
  ['KEY REL', '1', '2', '3', 'RSET'],
  ['0', 'ENTR'],
];

/**
 * The display and keyboard the crew read and keyed during the descent. The lamps on the left (an
 * alarm lights PROG); the program, verb and noun windows; the three registers, each with what it
 * means and its value in the source's units for a screen reader; the keyboard below. Flashing verb
 * and noun mean the computer is waiting for the crew.
 */
export function Dsky({ dsky, readout, onKey }: DskyProps) {
  const regs = registers(dsky, readout);
  const noun = NOUNS[dsky.noun];
  const meaning = (i: number) => {
    if (dsky.verb === 5 && dsky.noun === 9) return `Alarm code ${['first', 'second', 'latest'][i]}`;
    if (!noun || dsky.flashing) return 'blank';
    const reg = noun.registers[i];
    return `${reg.label}: ${readRegister(reg.format, reg.value(readout))}`;
  };
  const lit = { compActy: !dsky.flashing, keyRel: dsky.keyRel, oprErr: dsky.oprErr, prog: dsky.prog };
  return (
    <section className="zen-dsky" aria-label="DSKY">
      <div className="zen-dsky__top">
        <div className="zen-dsky__lamps">
          {LAMPS.map((l) => (
            <span key={l.id} className="zen-dsky__lamp" data-lamp={l.id} data-lit={lit[l.key] ? '' : undefined} aria-label={`${l.name} lamp ${lit[l.key] ? 'lit' : 'off'}`}>
              {l.name}
            </span>
          ))}
        </div>
        <div className="zen-dsky__panel">
          <div className="zen-dsky__windows">
            <div className="zen-dsky__window" aria-label={`Program ${dsky.program?.slice(1) ?? 'blank'}`}>
              <span className="zen-dsky__name">PROG</span>
              <span className="zen-dsky__digits">{dsky.program?.slice(1) ?? ''}</span>
            </div>
            <div className="zen-dsky__window" data-flashing={dsky.flashing ? '' : undefined} aria-label={`Verb ${pad(dsky.verb)}${dsky.flashing ? ', flashing' : ''}`}>
              <span className="zen-dsky__name">VERB</span>
              <span className="zen-dsky__digits">{dsky.entry?.into === 'verb' ? dsky.entry.digits.padEnd(2, '_') : pad(dsky.verb)}</span>
            </div>
            <div className="zen-dsky__window" data-flashing={dsky.flashing ? '' : undefined} aria-label={`Noun ${pad(dsky.noun)}${dsky.flashing ? ', flashing' : ''}`}>
              <span className="zen-dsky__name">NOUN</span>
              <span className="zen-dsky__digits">{dsky.entry?.into === 'noun' ? dsky.entry.digits.padEnd(2, '_') : pad(dsky.noun)}</span>
            </div>
          </div>
          {regs.map((value, i) => (
            <div key={i} className="zen-dsky__register" data-register={i + 1} aria-label={`R${i + 1}, ${meaning(i)}`}>
              <span className="zen-dsky__digits" aria-hidden="true">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="zen-dsky__keys" role="group" aria-label="DSKY keyboard">
        {KEYS.flat().map((k) => (
          <button key={k} type="button" className="zen-dsky__key" onClick={() => onKey(k)} aria-label={/^\d$/.test(k) ? `Key ${k}` : k}>
            {k}
          </button>
        ))}
      </div>
    </section>
  );
}
