import { describe, expect, it } from 'vitest';
import { CHANNELS, TIERS, countBy, filterLeads, formatReportDate, isReady, safeHref, leadsByChannel, leadsByTier, readyLeads, type Lead } from './report';
import { REPORT } from '../stories/report.fixtures';

const lead = (name: string, over: Partial<Lead> = {}): Lead => ({ name, tier: 'A', location: 'Somewhere', status: 'new', channel: 'email', ...over });

describe('countBy', () => {
  it('counts each key in first-seen order and leaves unseen keys out', () => {
    const counts = countBy(['b', 'a', 'b', 'c', 'b'], (s) => s);
    expect(counts).toEqual({ b: 3, a: 1, c: 1 });
    expect(Object.keys(counts)).toEqual(['b', 'a', 'c']);
  });

  it('is empty for no items', () => {
    expect(countBy([] as string[], (s) => s)).toEqual({});
  });
});

describe('leadsByTier', () => {
  it('has every tier, strongest first, each in report order', () => {
    const leads = [lead('c1', { tier: 'C' }), lead('a1'), lead('c2', { tier: 'C' }), lead('a2')];
    const by = leadsByTier({ leads });
    expect(Object.keys(by)).toEqual([...TIERS]);
    expect(by.A.map((l) => l.name)).toEqual(['a1', 'a2']);
    expect(by.B).toEqual([]);
    expect(by.C.map((l) => l.name)).toEqual(['c1', 'c2']);
  });

  it('matches the fixture segments', () => {
    const by = leadsByTier(REPORT);
    for (const s of REPORT.segments ?? []) expect(by[s.name as 'A' | 'B' | 'C']).toHaveLength(s.count);
  });
});

describe('leadsByChannel', () => {
  it('has every channel, each in report order', () => {
    const by = leadsByChannel({ leads: [lead('f', { channel: 'form' }), lead('e'), lead('f2', { channel: 'form' })] });
    expect(Object.keys(by)).toEqual([...CHANNELS]);
    expect(by.form.map((l) => l.name)).toEqual(['f', 'f2']);
    expect(by.email.map((l) => l.name)).toEqual(['e']);
    expect(by.agency).toEqual([]);
  });
});

describe('readyLeads', () => {
  it('keeps tier A leads reached by email or form that are not skipped', () => {
    const leads = [
      lead('email'),
      lead('form', { channel: 'form' }),
      lead('invite', { channel: 'invite' }),
      lead('unknown', { channel: 'unknown' }),
      lead('tier B', { tier: 'B' }),
      lead('skipped', { skip: 'defunct' }),
      lead('null skip', { skip: null }),
      lead('empty skip', { skip: '' }),
    ];
    expect(readyLeads({ leads }).map((l) => l.name)).toEqual(['email', 'form', 'null skip', 'empty skip']);
  });

  it('finds the eleven in the fixture (4 email, 7 form)', () => {
    const ready = readyLeads(REPORT);
    expect(ready).toHaveLength(11);
    expect(countBy(ready, (l) => l.channel)).toEqual({ email: 4, form: 7 });
    expect(ready.every(isReady)).toBe(true);
  });
});

describe('safeHref', () => {
  it('keeps http and https addresses', () => {
    expect(safeHref('https://example.com/a')).toBe('https://example.com/a');
    expect(safeHref('http://example.com')).toBe('http://example.com');
    expect(safeHref('HTTPS://EXAMPLE.COM')).toBe('HTTPS://EXAMPLE.COM');
  });

  it('drops every other scheme, relative paths and missing values', () => {
    for (const u of ['javascript:alert(1)', 'data:text/html,x', 'mailto:a@b.c', '//example.com', '/a', 'example.com', 'https:/x', '', null, undefined]) expect(safeHref(u)).toBeUndefined();
  });
});

describe('formatReportDate', () => {
  it('reads an ISO date as a calendar date', () => {
    expect(formatReportDate('2026-10-19')).toBe('19 October 2026');
    expect(formatReportDate('2027-01-01')).toBe('1 January 2027');
    expect(formatReportDate('2027-12-31')).toBe('31 December 2027');
  });

  it('returns anything else as written', () => {
    for (const s of ['Autumn 2026', '2026-13-01', '2026-00-10', '2026-10-00', '2026-10-19T10:00:00Z', '']) expect(formatReportDate(s)).toBe(s);
  });
});

describe('filterLeads', () => {
  const leads = [lead('a-email'), lead('a-form', { channel: 'form' }), lead('b-email', { tier: 'B' }), lead('a-skip', { skip: 'no' })];

  it('keeps everything with no filter or an empty one', () => {
    expect(filterLeads(leads)).toEqual(leads);
    expect(filterLeads(leads, {})).toEqual(leads);
    expect(filterLeads(leads, { ready: false })).toEqual(leads);
  });

  it('narrows by tier, channel and ready together', () => {
    expect(filterLeads(leads, { tier: 'B' }).map((l) => l.name)).toEqual(['b-email']);
    expect(filterLeads(leads, { channel: 'form' }).map((l) => l.name)).toEqual(['a-form']);
    expect(filterLeads(leads, { ready: true }).map((l) => l.name)).toEqual(['a-email', 'a-form']);
    expect(filterLeads(leads, { tier: 'A', channel: 'email', ready: true }).map((l) => l.name)).toEqual(['a-email']);
    expect(filterLeads(leads, { tier: 'C' })).toEqual([]);
  });
});
