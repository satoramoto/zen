// KnobBank: the page tabs choose by index, each knob's press and steps carry its position, a
// part's knob wears the part's hue and no other does, and an unused slot is quiet and inert.

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormProvider, principlesFor, resolveNeed } from '../../layout/assembly';
import { packs } from '../../themes/packs';
import { KNOB_BANK_FORMS, KNOB_PAGE_NAMES, KnobBank, KnobBankRegion, type KnobBankProps } from './KnobBank';
import { knobPages, reverbKnobs, styleKnobs } from './KnobBank.fixtures';

afterEach(() => cleanup());

describe('KnobBank forms', () => {
  const ids = KNOB_BANK_FORMS.map((f) => f.id);
  const root = () => document.querySelector('.yh-knobbank') as HTMLElement;
  const eight = () => {
    expect(document.querySelectorAll('.yh-knobbank__slot')).toHaveLength(8);
    expect(screen.getAllByRole('button')).toHaveLength(7);
    expect(screen.getByRole('img', { name: 'Knob 7: unused' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knob 1: Dynamics (DynCtrl) 127' })).toHaveTextContent('Dynamics');
    expect(screen.getByRole('button', { name: 'Knob 8: Tempo (Tempo) 104' })).toHaveTextContent('104');
  };

  it('is labelled then compact, and is the static KnobBank.forms', () => {
    expect(ids).toEqual(['labelled', 'compact']);
    expect(KnobBank.forms).toBe(KNOB_BANK_FORMS);
  });

  it('defaults to the first form', () => {
    render(<KnobBank knobs={styleKnobs} />);
    expect(root()).toHaveAttribute('data-form', 'labelled');
  });

  it.each(ids)('draws %s by prop, through the region, and through FormProvider, with all eight knobs', (id) => {
    render(<KnobBank knobs={styleKnobs} form={id} />);
    expect(root()).toHaveAttribute('data-form', id);
    eight();
    cleanup();
    render(<KnobBankRegion knobs={styleKnobs} pages={knobPages} form={id} />);
    expect(root()).toHaveAttribute('data-form', id);
    eight();
    cleanup();
    render(
      <FormProvider form={id}>
        <KnobBankRegion knobs={styleKnobs} pages={knobPages} />
      </FormProvider>,
    );
    expect(root()).toHaveAttribute('data-form', id);
    eight();
  });

  it('a form prop wins over the screen’s choice', () => {
    render(
      <FormProvider form="compact">
        <KnobBank knobs={styleKnobs} form="labelled" />
      </FormProvider>,
    );
    expect(root()).toHaveAttribute('data-form', 'labelled');
  });

  it('sizes the head from the same pages the fixtures name', () => {
    expect([...KNOB_PAGE_NAMES]).toEqual(knobPages);
  });

  it.each(packs.map((p) => [p.id, p] as const))('%s: min ≤ ideal ≤ max, each later form smaller at its min, the ring ≥ a target', (_, pack) => {
    const p = principlesFor(pack.facets, pack.principles);
    const target = Math.max(p.scale.control, p.minTarget);
    const sized = KNOB_BANK_FORMS.map((f) => ({
      min: resolveNeed(f.min, p),
      ideal: resolveNeed(f.ideal, p),
      maxH: f.max?.h ? resolveNeed({ w: 0, h: f.max.h }, p).h : Infinity,
    }));
    for (const s of sized) {
      expect(s.min.w).toBeLessThanOrEqual(s.ideal.w);
      expect(s.min.h).toBeLessThanOrEqual(s.ideal.h);
      expect(s.ideal.h).toBeLessThanOrEqual(s.maxH);
    }
    for (let i = 1; i < sized.length; i++) {
      const [a, b] = [sized[i - 1].min, sized[i].min];
      expect(b.w < a.w || b.h < a.h).toBe(true);
      expect(b.w).toBeLessThanOrEqual(a.w);
      expect(b.h).toBeLessThanOrEqual(a.h);
    }
    // compact at its least: the ring is what's left of the height after the name and --space-1.
    const caption = p.scale.sizes.caption;
    expect(sized[1].min.h - p.scale.unit - caption * 2.6).toBeCloseTo(target);
  });

  it('yahaha-classic (compact scale: control 28, unit 4, caption 11, label 13): the px', () => {
    const pack = packs.find((x) => x.id === 'yahaha-classic')!;
    const p = principlesFor(pack.facets, pack.principles);
    const px = (i: number) => {
      const f = KNOB_BANK_FORMS[i];
      return { min: resolveNeed(f.min, p), ideal: resolveNeed(f.ideal, p), maxH: resolveNeed({ w: 0, h: f.max!.h! }, p).h };
    };
    const close = (got: { w: number; h: number }, w: number, h: number) => {
      expect(got.w).toBeCloseTo(w, 5);
      expect(got.h).toBeCloseTo(h, 5);
    };
    // labelled: slots of 11 caption characters (72.6) → 8 × 72.6 + 7 × 4; 3 × 4 + 28.6 + 1.5 × 28.
    close(px(0).min, 608.8, 82.6);
    // ideal: slots of 2.75 × 28 + 2 × 4 = 85 → 708; 12 + 28.6 + 77.
    close(px(0).ideal, 708, 117.6);
    expect(px(0).maxH).toBeCloseTo(138.6, 5);
    // compact: slots of 7 caption characters (46.2) → 397.6, wider than the tabs (386.2); 4 + 28.6 + 28.
    close(px(1).min, 397.6, 60.6);
    // ideal: slots of 2 × 28 + 8 = 64 → 540; 4 + 28.6 + 56.
    close(px(1).ideal, 540, 88.6);
    expect(px(1).maxH).toBeCloseTo(109.6, 5);
  });
});

function setup(props: Partial<KnobBankProps> = {}) {
  const onPage = vi.fn<(index: number) => void>();
  const onPress = vi.fn<(index: number) => void>();
  const onStep = vi.fn<(index: number, delta: number) => void>();
  render(
    <KnobBankRegion knobs={styleKnobs} pages={knobPages} page={0} onPage={onPage} onPress={onPress} onStep={onStep} {...props} />,
  );
  return { onPage, onPress, onStep };
}

describe('KnobBank pages', () => {
  it('is one region named Knobs, with one tab per page and the chosen one selected', () => {
    setup({ page: 3 });
    const region = screen.getByRole('region', { name: 'Knobs' });
    const list = within(region).getByRole('tablist', { name: 'Knobs' });
    expect(within(list).getAllByRole('tab').map((t) => t.textContent)).toEqual(knobPages);
    expect(within(list).getByRole('tab', { name: 'Reverb' })).toHaveAttribute('aria-selected', 'true');
    expect(within(list).getByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'false');
    expect(within(list).getByRole('tab', { name: 'Reverb' })).toHaveAttribute('data-tip', 'knobs.page');
  });

  it('has no title and no region inside the region: the bank is the tab panel', () => {
    setup();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toContainElement(screen.getByRole('button', { name: /^Knob 1:/ }));
  });

  it('the bank alone draws the knobs and no tabs', () => {
    render(<KnobBank knobs={styleKnobs} pages={knobPages} page={0} />);
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('a tab click or an arrow key asks for that page by index', async () => {
    const { onPage } = setup();
    await userEvent.click(screen.getByRole('tab', { name: 'Reverb' }));
    expect(onPage).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Style' }), { key: 'ArrowRight' });
    expect(onPage).toHaveBeenLastCalledWith(1);
  });

  it('without pages, the page label is the one tab, chosen', () => {
    setup({ pages: [], pageLabel: 'Swap R1', page: 4 });
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(1);
    expect(tabs[0]).toHaveTextContent('Swap R1');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });
});

describe('KnobBank knobs', () => {
  it('names each knob by position, name, code and value', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Knob 1: Dynamics (DynCtrl) 127' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knob 2: Retrig rate (RtgRate) 1/8' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knob 6: Swing (Swing) 0%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Knob 8: Tempo (Tempo) 104' })).toHaveAttribute('data-tip', 'knobs.knob');
  });

  it('draws the plain name but not the Genos code, which stays in the spoken name', () => {
    setup();
    const dynamics = screen.getByRole('button', { name: 'Knob 1: Dynamics (DynCtrl) 127' });
    expect(dynamics).toHaveTextContent('Dynamics');
    expect(dynamics).not.toHaveTextContent('DynCtrl');
    expect(dynamics.querySelector('.yh-knob__code')).toBeNull();
  });

  it('a press and a step carry the knob position', async () => {
    const { onPress, onStep } = setup();
    const swing = screen.getByRole('button', { name: /^Knob 6:/ });
    await userEvent.click(swing);
    expect(onPress).toHaveBeenCalledWith(5);
    fireEvent.keyDown(swing, { key: 'ArrowUp' });
    expect(onStep).toHaveBeenLastCalledWith(5, 1);
    fireEvent.keyDown(screen.getByRole('button', { name: /^Knob 8:/ }), { key: 'ArrowDown' });
    expect(onStep).toHaveBeenLastCalledWith(7, -1);
  });

  it('an unused slot is a quiet mark, still named, not a control', () => {
    const { onPress } = setup();
    expect(screen.getAllByRole('button')).toHaveLength(7);
    const empty = screen.getByRole('img', { name: 'Knob 7: unused' });
    expect(empty).not.toHaveTextContent('---');
    fireEvent.click(empty);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('always draws eight slots, like the hardware: missing knobs are unused, extras ignored', () => {
    const { onPress } = setup({ knobs: styleKnobs.slice(0, 3) });
    const region = screen.getByRole('region', { name: 'Knobs' });
    expect(region.querySelectorAll('.yh-knobbank__slot')).toHaveLength(8);
    expect(within(region).getAllByRole('button')).toHaveLength(3);
    for (const n of [4, 5, 6, 7, 8]) expect(within(region).getByRole('img', { name: `Knob ${n}: unused` })).toBeInTheDocument();
    fireEvent.click(within(region).getByRole('img', { name: 'Knob 8: unused' }));
    expect(onPress).not.toHaveBeenCalled();
    cleanup();
    setup({ knobs: [...styleKnobs, ...styleKnobs] });
    const full = screen.getByRole('region', { name: 'Knobs' });
    expect(full.querySelectorAll('.yh-knobbank__slot')).toHaveLength(8);
    expect(within(full).getAllByRole('button')).toHaveLength(7);
    expect(within(full).queryByRole('button', { name: /^Knob 9:/ })).toBeNull();
  });

  it('an unused slot is drawn as a full ring with no value or name, and is skipped by Tab', async () => {
    setup({ pages: [] });
    const empty = screen.getByRole('img', { name: 'Knob 7: unused' });
    expect(empty.querySelector('svg path')).not.toBeNull();
    expect(empty.textContent).toBe('');
    expect(empty).not.toHaveAttribute('tabindex');
    screen.getByRole('button', { name: /^Knob 6:/ }).focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Knob 8:/ }));
  });

  it('only a knob that belongs to a part wears a hue, the part’s', () => {
    setup({ knobs: reverbKnobs, page: 3 });
    const hue = (n: number) => screen.getByRole('button', { name: new RegExp(`^Knob ${n}:`) }).getAttribute('data-hue');
    expect([1, 2, 3, 4].map(hue)).toEqual(['1', '2', '3', '4']);
    expect(hue(5)).toBeNull();
    expect(hue(8)).toBeNull();
    cleanup();
    setup();
    for (const button of screen.getAllByRole('button')) expect(button).not.toHaveAttribute('data-hue');
  });

  it('passes the tooltip hook to every knob with its key', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    const calls = tipAction.mock.calls as [HTMLElement, string][];
    expect(calls.filter(([, key]) => key === 'knobs.knob')).toHaveLength(7);
    expect(tipAction).toHaveBeenCalledWith(expect.any(HTMLElement), 'knobs.knob');
  });

  it('gives each page tab the knobs.page key and runs the hook on it, once per node', () => {
    const tipAction = vi.fn();
    setup({ tipAction });
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(knobPages.length);
    for (const tab of tabs) {
      expect(tab).toHaveAttribute('data-tip', 'knobs.page');
      expect(tipAction).toHaveBeenCalledWith(tab, 'knobs.page');
    }
    expect(tipAction).toHaveBeenCalledTimes(7 + tabs.length);
  });
});
