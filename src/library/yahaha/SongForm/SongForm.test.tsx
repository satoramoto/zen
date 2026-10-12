import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeScope, resolveTheme } from '../../theme';
import { packs } from '../../themes/packs';
import { scales } from '../../themes/scales';
import { FormProvider, principlesFor, resolveLength, resolveNeed, type Forms, type Length } from '../../layout/assembly';
import {
  BOTH_GAP,
  BREAKS,
  FORM_FORMS,
  SECTION_LABEL,
  SONG_FORM_FORMS,
  SongForm,
  TRANSPORT_FORMS,
  type SongFormProps,
} from './SongForm';
import { WIDTHS } from './SongForm.forms';
import { DISPLAY_FORMS } from '../Display/Display.forms';

describe('SongForm labels', () => {
  it('joins a section name with a non-breaking space, so "Main C" never wraps', () => {
    expect(SECTION_LABEL.mainC).toContain(' ');
    expect(SECTION_LABEL.mainC).not.toContain(' ');
  });
});
import { songFormBoard, songFormFillPending, songFormSparse, songFormStopped, songFormSyncArmed } from './SongForm.fixtures';

const renderForm = (props: SongFormProps = songFormBoard) => render(<SongForm {...props} />);

describe('Yahaha SongForm', () => {
  it('lays the sections out in the song’s order, Break apart, Auto Fill in the transport', () => {
    renderForm();
    const form = screen.getByRole('group', { name: 'Sections' });
    const order = Array.from(form.querySelectorAll('[data-section]')).map((n) => n.getAttribute('data-section'));
    expect(order).toEqual([
      'intro1', 'intro2', 'intro3', 'mainA', 'mainB', 'mainC', 'mainD', 'ending1', 'ending2', 'ending3', 'break',
    ]);
    const insert = within(form).getByRole('group', { name: 'Insert' });
    expect(within(insert).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Break']);
    // The strip is one primitive: every control in the form is a step Pad.
    expect(within(form).getAllByRole('button').every((b) => b.classList.contains('yh-pad'))).toBe(true);
    expect(within(screen.getByRole('group', { name: 'Transport' })).getByRole('button', { name: 'Auto Fill' })).toBeInTheDocument();
    // No Tap and no tempo here: they live in the Display.
    expect(screen.queryByRole('button', { name: /tap/i })).toBeNull();
  });

  it('marks what plays now and what comes next, by name and pressed state', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Main B, playing' })).toHaveAttribute('aria-pressed', 'true');
    const next = screen.getByRole('button', { name: 'Main C, next, after bar 4' });
    expect(next).toHaveAttribute('aria-pressed', 'false');
    expect(next.closest('[data-section]')).toHaveAttribute('data-state', 'next');
  });

  it('says next once on screen: no title or cue line, the cue only spoken', () => {
    const { container } = renderForm();
    expect(screen.getByRole('status')).toHaveTextContent('Next: Main C, after bar 4');
    expect(container.querySelector('.yh-songform__head, .yh-songform__title, .yh-waitingchip')).toBeNull();
    // Only the part captions are drawn; Break has none.
    expect(Array.from(container.querySelectorAll('.yh-songform__caption')).map((c) => c.textContent)).toEqual([
      'Intro',
      'Main',
      'Ending',
    ]);
  });

  it('fills only the sounding section: one fill while running, none while stopped', () => {
    const fills = (c: HTMLElement) => c.querySelectorAll(".yh-songform__form .yh-pad[data-state='playing']").length;
    const { container, rerender } = render(<SongForm {...songFormBoard} />);
    expect(fills(container)).toBe(1);
    expect(container.querySelector('[data-start]')).toBeNull();
    rerender(<SongForm {...songFormStopped} />);
    expect(fills(container)).toBe(0);
    expect(container.querySelector('[data-start]')).toHaveAttribute('data-section', 'mainA');
  });

  it('draws one half alone when asked', () => {
    const { unmount } = renderForm({ ...songFormBoard, part: 'form' });
    // The root is a plain element: the screen's Region names it.
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByRole('group', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Transport' })).toBeNull();
    unmount();
    renderForm({ ...songFormBoard, part: 'transport' });
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByRole('group', { name: 'Transport' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Sections' })).toBeNull();
  });

  it('says the stopped band’s section is where it starts, underlined rather than filled', () => {
    renderForm(songFormStopped);
    const start = screen.getByRole('button', { name: 'Main A, starts here' });
    expect(start).toHaveAttribute('data-state', 'idle');
    expect(start).toHaveAttribute('aria-pressed', 'false');
    expect(start.closest('[data-section]')).toHaveAttribute('data-start');
  });

  it('queues a pressed section, and ignores an absent one', async () => {
    const onSection = vi.fn();
    renderForm({ ...songFormSparse, onSection });
    await userEvent.click(screen.getByRole('button', { name: 'Ending I' }));
    await userEvent.click(screen.getByRole('button', { name: 'Main C, not in this style' }));
    await userEvent.click(screen.getByRole('button', { name: 'Break, not in this style' }));
    expect(onSection.mock.calls).toEqual([['ending1']]);
    expect(screen.getByRole('button', { name: 'Intro III, not in this style' }).closest('[data-section]')).toHaveAttribute(
      'data-state',
      'absent',
    );
  });

  it('announces absent sections as unavailable, keeps them focusable, and ignores Enter on them', async () => {
    const onSection = vi.fn();
    const user = userEvent.setup();
    renderForm({ ...songFormBoard, onSection });
    const intro3 = screen.getByRole('button', { name: 'Intro III, not in this style' });
    const ending3 = screen.getByRole('button', { name: 'Ending III, not in this style' });
    expect(intro3).toHaveAttribute('aria-disabled', 'true');
    expect(ending3).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Intro II' })).not.toHaveAttribute('aria-disabled');
    intro3.focus();
    expect(intro3).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.click(ending3);
    expect(onSection).not.toHaveBeenCalled();
  });

  it('rings the queued section in the accent', () => {
    renderForm();
    const next = screen.getByRole('button', { name: 'Main C, next, after bar 4' });
    expect(next).toHaveAttribute('data-next', 'accent');
    expect(next).toHaveAttribute('data-fill');
  });

  it('Start / Stop is the tall key: filled primary while stopped, outlined in the running colour while running', () => {
    const { rerender } = render(<SongForm {...songFormStopped} />);
    const stopped = screen.getByRole('button', { name: 'Start / Stop, stopped' });
    expect(stopped).toHaveAttribute('data-tall');
    expect(stopped).toHaveAttribute('data-variant', 'primary');
    expect(stopped).toHaveAttribute('data-face', 'off');

    rerender(<SongForm {...songFormBoard} />);
    const running = screen.getByRole('button', { name: /^Start \/ Stop, running/ });
    expect(running).toHaveAttribute('data-tall');
    // Not the filled running face: an outline in --success, quieter than the hero's section name.
    expect(running).toHaveAttribute('data-variant', 'secondary');
    expect(running).toHaveAttribute('data-hue', 'ok');
    expect(running).toHaveAttribute('data-face', 'off');
    expect(running).not.toHaveAttribute('data-bar');
  });

  it('the keys that move time wear the transport tone; running stays success, the rest neutral', () => {
    const { container, rerender } = render(<SongForm {...songFormStopped} />);
    expect(screen.getByRole('button', { name: 'Start / Stop, stopped' })).toHaveAttribute('data-hue', 'role-2');
    const key = (k: string) => container.querySelector(`.yh-songform__key[data-key='${k}'] button`);
    for (const k of ['sync-start', 'sync-stop', 'fill-up', 'fill-down', 'auto-fill']) expect(key(k), k).toHaveAttribute('data-hue', 'role-2');
    for (const k of ['accomp', 'fade', 'reset']) expect(key(k), k).toHaveAttribute('data-hue', 't');
    // One rank for every key but Start: Reset is an outlined key like Fade, not a quiet word.
    for (const k of ['sync-start', 'sync-stop', 'fill-up', 'fill-down', 'fade', 'reset']) expect(key(k), k).toHaveAttribute('data-variant', 'secondary');
    rerender(<SongForm {...songFormBoard} />);
    expect(screen.getByRole('button', { name: /^Start \/ Stop, running/ })).toHaveAttribute('data-hue', 'ok');
  });

  it('waiting keys flash with the queued section', () => {
    const { rerender } = render(<SongForm {...songFormFillPending} lit={false} />);
    expect(screen.getByRole('button', { name: /^Fill Up: .*queued$/ })).toHaveAttribute('data-lit', 'false');
    rerender(<SongForm {...songFormSyncArmed} fading lit={false} />);
    expect(screen.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('data-lit', 'false');
    expect(screen.getByRole('button', { name: 'Fade in, waiting for Start' })).toHaveAttribute('data-lit', 'false');
    rerender(<SongForm {...songFormSyncArmed} lit />);
    expect(screen.getByRole('button', { name: 'Sync Start, armed' })).not.toHaveAttribute('data-lit');
  });

  it('Start / Stop says the action and calls back; held while running, it stops with a fade', async () => {
    const onStartStop = vi.fn();
    const onStopWithFade = vi.fn();
    const { rerender } = render(<SongForm {...songFormStopped} onStartStop={onStartStop} onStopWithFade={onStopWithFade} />);
    const stopped = screen.getByRole('button', { name: 'Start / Stop, stopped' });
    expect(stopped).toHaveTextContent('Start');
    expect(stopped).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(stopped);
    expect(onStartStop).toHaveBeenCalledTimes(1);

    rerender(<SongForm {...songFormBoard} onStartStop={onStartStop} onStopWithFade={onStopWithFade} />);
    const running = screen.getByRole('button', { name: /Start \/ Stop, running/ });
    expect(running).toHaveTextContent('Stop');
    expect(running).toHaveAttribute('aria-pressed', 'true');
    await userEvent.pointer({ keys: '[MouseRight]', target: running });
    expect(onStopWithFade).toHaveBeenCalledTimes(1);
  });

  it('every control works from the keyboard', async () => {
    const calls: string[] = [];
    const log = (name: string) => (...args: unknown[]) => calls.push([name, ...args].join(':'));
    const user = userEvent.setup();
    renderForm({
      ...songFormBoard,
      onSection: log('section'),
      onAutoFill: log('autoFill'),
      onStartStop: log('startStop'),
      onSyncStart: log('syncStart'),
      onSyncStop: log('syncStop'),
      onAccomp: log('accomp'),
      onFillUp: log('fillUp'),
      onFillDown: log('fillDown'),
      onFade: log('fade'),
      onReset: log('reset'),
    });
    // Tab through every control, pressing each with Enter (sections) or Space (the rest).
    for (let i = 0; i < 30; i++) {
      await user.tab();
      if (document.activeElement === document.body) break;
      await user.keyboard(i % 2 ? ' ' : '{Enter}');
    }
    expect(calls).toEqual([
      'section:intro1',
      'section:intro2',
      // Intro III is absent: no call.
      'section:mainA',
      'section:mainB',
      'section:mainC',
      'section:mainD',
      'section:ending1',
      'section:ending2',
      // Ending III is absent.
      'section:break',
      // The transport, a column at a time.
      'startStop',
      'syncStart:true',
      'syncStop:true',
      'fillUp',
      'fillDown',
      'fade',
      'reset',
      'accomp:false',
      'autoFill:true',
    ]);
  });

  it('switches report the state asked for, and show their own', () => {
    renderForm({ ...songFormSyncArmed, syncStop: true, autoFill: true });
    expect(screen.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Sync Start, armed' })).toHaveAttribute('data-face', 'waiting');
    expect(screen.getByRole('button', { name: 'Sync Stop' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Auto Fill' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Accomp (ACMP)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Starts with the first chord');
  });

  it('a queued fill waits on its key and is spoken in the cue', () => {
    renderForm(songFormFillPending);
    expect(screen.getByRole('button', { name: 'Fill Up: a fill, then the next Main up, queued' })).toHaveAttribute(
      'data-face',
      'waiting',
    );
    expect(screen.getByRole('button', { name: 'Fill Down: a fill, then the next Main down' })).toHaveAttribute(
      'data-face',
      'off',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Fill, then Main C, after bar 4');
  });

  it('Fade is on while fading out, and waits while a fade-in waits for Start', () => {
    const { rerender } = render(<SongForm {...songFormBoard} fading />);
    expect(screen.getByRole('button', { name: 'Fade, fading' })).toHaveAttribute('data-face', 'on');
    rerender(<SongForm {...songFormStopped} fading />);
    const waiting = screen.getByRole('button', { name: 'Fade in, waiting for Start' });
    expect(waiting).toHaveAttribute('data-face', 'waiting');
    expect(waiting).toHaveAttribute('aria-pressed', 'true');
  });

  it('no section takes a part hue', () => {
    const { container } = renderForm();
    for (const pad of container.querySelectorAll('.yh-pad')) expect(pad.getAttribute('data-tone')).toBe('neutral');
  });

  it('renders under every theme pack', () => {
    for (const pack of packs) {
      const { facets } = resolveTheme({ theme: pack.id });
      const { unmount } = render(
        <ThemeScope facets={facets}>
          <SongForm {...songFormBoard} />
        </ThemeScope>,
      );
      expect(screen.getByRole('group', { name: 'Sections' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Transport' })).toBeInTheDocument();
      unmount();
    }
  });
});

const TRANSPORT_KEYS = [
  /^Start \/ Stop/,
  /^Sync Start/,
  /^Sync Stop/,
  /^Fill Up/,
  /^Fill Down/,
  /^Fade/,
  /^Section reset/,
  /^Accomp/,
  /^Auto Fill/,
];
const SECTIONS = ['intro1', 'intro2', 'intro3', 'mainA', 'mainB', 'mainC', 'mainD', 'ending1', 'ending2', 'ending3', 'break'];

const expectEveryTransportKey = () => {
  const transport = screen.getByRole('group', { name: 'Transport' });
  for (const name of TRANSPORT_KEYS) expect(within(transport).getByRole('button', { name }), String(name)).toBeInTheDocument();
  expect(within(transport).getAllByRole('button')).toHaveLength(TRANSPORT_KEYS.length);
};
const expectEverySection = () => {
  const form = screen.getByRole('group', { name: 'Sections' });
  expect(Array.from(form.querySelectorAll('[data-section]')).map((n) => n.getAttribute('data-section'))).toEqual(SECTIONS);
  // Now, next and absent stay marked in every form.
  expect(form.querySelector("[data-section='mainB']")).toHaveAttribute('data-state', 'playing');
  expect(form.querySelector("[data-section='mainC']")).toHaveAttribute('data-state', 'next');
  expect(form.querySelector("[data-section='intro3']")).toHaveAttribute('data-state', 'absent');
  // Every part keeps its caption.
  expect(Array.from(form.querySelectorAll('.yh-songform__caption')).map((c) => c.textContent)).toEqual(['Intro', 'Main', 'Ending']);
};
const half = (c: HTMLElement, name: 'form' | 'transport') => c.querySelector(`.yh-songform__${name}`);

/** Every pack as designed, and every pack under every scale (a pack's scale is one facet of it). */
const WORN = packs.flatMap((pack) => [
  { id: pack.id, p: principlesFor(pack.facets, pack.principles) },
  ...scales.map((scale) => ({ id: `${pack.id}@${scale.id}`, p: principlesFor({ ...pack.facets, scale }, pack.principles) })),
]);

describe('SongForm forms', () => {
  it('takes each form by prop, on the root and its half, with every control present', () => {
    for (const { id } of TRANSPORT_FORMS) {
      const { container, unmount } = render(<SongForm {...songFormBoard} part="transport" transportForm={id} />);
      expect(container.querySelector('.yh-songform')).toHaveAttribute('data-form', id);
      expect(half(container, 'transport')).toHaveAttribute('data-form', id);
      expectEveryTransportKey();
      unmount();
    }
    for (const { id } of FORM_FORMS) {
      const { container, unmount } = render(<SongForm {...songFormBoard} part="form" formForm={id} />);
      expect(container.querySelector('.yh-songform')).toHaveAttribute('data-form', id);
      expect(half(container, 'form')).toHaveAttribute('data-form', id);
      expectEverySection();
      unmount();
    }
  });

  it('defaults to the richest form outside an assembled screen', () => {
    const { container } = render(<SongForm {...songFormBoard} />);
    expect(half(container, 'form')).toHaveAttribute('data-form', 'strip');
    expect(half(container, 'transport')).toHaveAttribute('data-form', 'keys');
    // Both carries its form on each half, not the root.
    expect(container.querySelector('.yh-songform')).not.toHaveAttribute('data-form');
  });

  it('reads the region’s form through FormProvider, and each part’s in both', () => {
    for (const { id } of TRANSPORT_FORMS) {
      const { container, unmount } = render(
        <FormProvider form={id}>
          <SongForm {...songFormBoard} part="transport" />
        </FormProvider>,
      );
      expect(container.querySelector('.yh-songform')).toHaveAttribute('data-form', id);
      expectEveryTransportKey();
      unmount();
    }
    for (const { id } of FORM_FORMS) {
      const { container, unmount } = render(
        <FormProvider form={id}>
          <SongForm {...songFormBoard} part="form" />
        </FormProvider>,
      );
      expect(container.querySelector('.yh-songform')).toHaveAttribute('data-form', id);
      expectEverySection();
      unmount();
    }
    for (const f of SONG_FORM_FORMS) {
      const { container, unmount } = render(
        <FormProvider form={f.id} parts={f.parts}>
          <SongForm {...songFormBoard} />
        </FormProvider>,
      );
      expect(half(container, 'form')).toHaveAttribute('data-form', f.parts!.form);
      expect(half(container, 'transport')).toHaveAttribute('data-form', f.parts!.transport);
      expectEverySection();
      expectEveryTransportKey();
      unmount();
    }
    // Any pairing the screen names, even one the list doesn't (folded over compact).
    const { container } = render(
      <FormProvider form="custom" parts={{ form: 'folded', transport: 'compact' }}>
        <SongForm {...songFormBoard} />
      </FormProvider>,
    );
    expect(half(container, 'form')).toHaveAttribute('data-form', 'folded');
    expect(half(container, 'transport')).toHaveAttribute('data-form', 'compact');
  });

  it('a pinned form wins over the region’s', () => {
    const { container } = render(
      <FormProvider form="full" parts={{ form: 'strip', transport: 'keys' }}>
        <SongForm {...songFormBoard} formForm="folded" transportForm="compact" />
      </FormProvider>,
    );
    expect(half(container, 'form')).toHaveAttribute('data-form', 'folded');
    expect(half(container, 'transport')).toHaveAttribute('data-form', 'compact');
  });

  const lists: [string, Forms][] = [
    ['TRANSPORT_FORMS', TRANSPORT_FORMS],
    ['FORM_FORMS', FORM_FORMS],
    ['SONG_FORM_FORMS', SONG_FORM_FORMS],
  ];

  it('lists its forms most room first under every pack: each smaller on an axis at its min, min ≤ ideal', () => {
    for (const pack of WORN) {
      const { p } = pack;
      for (const [name, forms] of lists) {
        forms.forEach((f, i) => {
          const min = resolveNeed(f.min, p);
          const ideal = resolveNeed(f.ideal, p);
          const at = `${pack.id} ${name} ${f.id}`;
          expect(min.w, at).toBeGreaterThan(0);
          expect(min.h, at).toBeGreaterThan(0);
          expect(min.w, at).toBeLessThanOrEqual(ideal.w);
          expect(min.h, at).toBeLessThanOrEqual(ideal.h);
          if (i > 0) {
            const prev = resolveNeed(forms[i - 1].min, p);
            expect(min.w < prev.w || min.h < prev.h, `${at} is smaller than ${forms[i - 1].id} on an axis`).toBe(true);
          }
        });
      }
    }
  });

  it('SONG_FORM_FORMS is its parts added up: the form over the transport, BOTH_GAP apart', () => {
    for (const pack of WORN) {
      const { p } = pack;
      const gap = resolveLength({ space: BOTH_GAP }, p);
      for (const f of SONG_FORM_FORMS) {
        const form = FORM_FORMS.find((x) => x.id === f.parts!.form)!;
        const transport = TRANSPORT_FORMS.find((x) => x.id === f.parts!.transport)!;
        for (const key of ['min', 'ideal'] as const) {
          const a = resolveNeed(form[key], p);
          const b = resolveNeed(transport[key], p);
          const both = resolveNeed(f[key], p);
          expect(both.w, `${pack.id} ${f.id} ${key}`).toBeCloseTo(Math.max(a.w, b.w), 6);
          expect(both.h, `${pack.id} ${f.id} ${key}`).toBeCloseTo(a.h + gap + b.h, 6);
        }
        expect(f.grow).toEqual({ w: true, h: true });
      }
    }
  });

  it('the CSS width breakpoints hold every font’s row under every scale', () => {
    for (const pack of WORN) {
      const { p } = pack;
      const em = (len: Length) => resolveLength(len, p) / p.scale.control;
      const at = pack.id;
      // The strip at its least is at body size, and every width under a breakpoint fits its font.
      expect(em(FORM_FORMS[0].min.w), at).toBeLessThanOrEqual(BREAKS.stripHeading);
      expect(em(WIDTHS.strip('heading')), at).toBeLessThanOrEqual(BREAKS.stripHeading);
      expect(em(WIDTHS.strip('numeral')), at).toBeLessThanOrEqual(BREAKS.stripNumeral);
      expect(em(FORM_FORMS[1].min.w), at).toBeLessThanOrEqual(BREAKS.foldedHeading);
      expect(em(WIDTHS.folded('heading')), at).toBeLessThanOrEqual(BREAKS.foldedHeading);
      expect(em(WIDTHS.keysBig), at).toBeLessThanOrEqual(BREAKS.keysBig);
      // Every form's least is above the last-resort wrap (21 control heights).
      for (const f of FORM_FORMS) expect(em(f.min.w), `${at} ${f.id}`).toBeGreaterThan(21);
    }
  });

  it('the transport gets narrower form by form at its min, and tight is never taller than the hero’s least', () => {
    const minimal = DISPLAY_FORMS.find((f) => f.id === 'minimal')!;
    for (const pack of WORN) {
      const { p } = pack;
      const [keys, tight, compact] = (['keys', 'tight', 'compact'] as const).map((id) => resolveNeed(TRANSPORT_FORMS.find((f) => f.id === id)!.min, p));
      expect(TRANSPORT_FORMS.map((f) => f.id)).toEqual(['keys', 'tight', 'compact']);
      expect(tight.w, pack.id).toBeLessThan(keys.w);
      expect(compact.w, pack.id).toBeLessThan(tight.w);
      // Three key rows, so it sits beside the hero without setting the row's height.
      expect(tight.h, pack.id).toBeLessThan(compact.h);
      expect(tight.h, pack.id).toBeLessThanOrEqual(resolveNeed(minimal.min, p).h);
    }
  });

  it('compact fits beside the hero on a 900 px screen: about 12 control heights wide', () => {
    for (const pack of WORN) {
      const { p } = pack;
      const compact = TRANSPORT_FORMS.find((f) => f.id === 'compact')!;
      expect(resolveLength(compact.min.w, p) / p.scale.control, pack.id).toBeLessThanOrEqual(12);
      // Every key at least one control height, and that at least the target floor.
      expect(p.scale.control).toBeGreaterThanOrEqual(p.minTarget);
    }
  });
});
