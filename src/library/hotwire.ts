// The Hotwire entry: `@satoramoto/zen/hotwire`. zen's core parts in a server-rendered app that
// uses Turbo and Stimulus (a Rails app), drawn in the browser by the DOM renderer
// (`foundation/view/Tree.dom.ts`) with no React, no Svelte and no Node at run time.
//
//   import { Application } from '@hotwired/stimulus';
//   import { registerZen } from 'zen';
//   registerZen(Application.start());
//
// `zen` draws a part from a placeholder the server wrote:
//
//   <div data-controller="zen" data-zen-part-value="Select"
//        data-zen-props-value='{"items":["Best published","Median"],"index":0,"name":"Figure to beat"}'
//        data-zen-field-value="basis" data-zen-values-value='["top","median"]'></div>
//
// It mounts when Turbo puts it in the page (a visit, a frame, a stream) and is destroyed when it
// goes; new props in the attribute update it in place; a morph keeps it and takes the new props; a
// page cached for the back button holds the bare placeholder. Each callback is a bubbling
// `zen:<name>` event (`onChange` → `zen:change`, its arguments in `detail`); a part with a value
// holds a new one itself, and with a field it keeps a hidden input of that name in step and fires
// `input` and `change` from it, as a native field does. `<template data-zen-slot="icon">` inside
// the placeholder fills the part's `icon` slot. `zen-theme` scopes an element to a pack:
//
//   <body data-controller="zen-theme" data-zen-theme-pack-value="linear" data-zen-theme-mode-value="system">
//
// `docs/rails.md` is the how-to.
import { Controller, type Application } from '@hotwired/stimulus';
import { cloneFill } from './foundation/view/dom';
import type { DomFill, DomScope } from './foundation/view/Tree.dom';
import { domComponent, domParts, mountPart } from './foundation/view/domComponents';
import { resolveTheme } from './resolve';
import { getSystemMode, resolveMode, scopeView, subscribeSystemMode, type ModeChoice } from './theme.model';
// The scope's own rules, as `ThemeScope` brings them (theme.tsx); each part's DOM binding brings its stylesheet.
import './library.css';
import './yahaha/tokens.css';

/** The event a callback prop is dispatched as: `onChange` → `zen:change`, `onchange` → `zen:change`. */
export const eventName = (callback: string) => `zen:${callback.replace(/^on/, '').toLowerCase()}`;

/** The scope a `zen-theme` element publishes, read by the parts inside it. */
const SCOPE = Symbol.for('zen.scope');
type Scoped = Element & { [SCOPE]?: DomScope };
/** Sent to each part inside a `zen-theme` element when its theme changes. */
const SCOPE_CHANGED = 'zen:scope-changed';

const scopeOf = (element: Element): DomScope | null => {
  for (let at: Element | null = element; at; at = at.parentElement) if ((at as Scoped)[SCOPE]) return (at as Scoped)[SCOPE]!;
  return null;
};

/** The placeholder's own children the controller keeps: its slot templates, and nothing it drew. */
const PART = 'data-zen-drawn';
const FIELD = 'data-zen-field';
/** On the placeholder while its part is drawn (library.css holds a control's height until then). */
const READY = 'data-zen-ready';

/**
 * Draws the part `part` names with `props`: the placeholder's controller (`data-controller="zen"`).
 * Values: `part` (a part's name, `Select`), `props` (its props as JSON), `field` (a form field's
 * name, for a part with a value) and `values` (the field's value for each position, for a part
 * whose value is an index).
 */
export class ZenController extends Controller<HTMLElement> {
  static values = { part: String, props: Object, field: String, values: Array };

  declare partValue: string;
  declare propsValue: Record<string, unknown>;
  declare fieldValue: string;
  declare valuesValue: string[];
  declare readonly hasFieldValue: boolean;
  declare readonly hasValuesValue: boolean;

  private drawn: ReturnType<typeof mountPart> | null = null;
  private host: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private props: Record<string, unknown> = {};
  private slots: Record<string, DomFill> = {};
  private watching: MutationObserver | null = null;
  private readonly morph = (event: Event) => this.beforeMorph(event as CustomEvent<{ newElement?: Element }>);
  private readonly cache = () => this.teardown();
  private readonly rescope = () => this.draw();

  connect() {
    this.teardown();
    this.props = { ...this.propsValue };
    this.readSlots();
    const host = document.createElement('div');
    host.setAttribute(PART, '');
    host.style.display = 'contents';
    this.element.append(host);
    this.host = host;
    if (this.fieldValue) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = this.fieldValue;
      input.setAttribute(FIELD, '');
      this.element.append(input);
      this.input = input;
      this.writeField();
    }
    this.drawn = mountPart(host, this.partValue, this.partProps(), { scope: scopeOf(this.element) });
    this.element.setAttribute(READY, '');
    this.watching = new MutationObserver((records) => {
      if (records.some((r) => [...r.addedNodes, ...r.removedNodes].some((n) => n instanceof HTMLTemplateElement))) {
        this.readSlots();
        this.draw();
      }
    });
    this.watching.observe(this.element, { childList: true });
    document.addEventListener('turbo:before-morph-element', this.morph);
    document.addEventListener('turbo:before-cache', this.cache);
    this.element.addEventListener(SCOPE_CHANGED, this.rescope);
  }

  disconnect() {
    this.teardown();
  }

  /** New props from the server (the attribute changed): drawn in place. */
  propsValueChanged() {
    if (!this.drawn) return;
    this.props = { ...this.propsValue };
    this.writeField();
    this.draw();
  }

  partValueChanged() {
    if (this.drawn) this.connect();
  }

  fieldValueChanged() {
    if (this.drawn) this.connect();
  }

  valuesValueChanged() {
    if (this.drawn) this.writeField();
  }

  private definition() {
    return domComponent(this.partValue);
  }

  /** The props the part gets: the server's (and any value the part reported since), its slots
   *  from the templates, and each callback as an event. */
  private partProps(): Record<string, unknown> {
    const { events = [], value } = this.definition().options;
    const props: Record<string, unknown> = { ...this.props, ...this.slots };
    for (const callback of events) {
      props[callback] = (...args: unknown[]) => {
        if (value && value.on === callback) {
          this.props = { ...this.props, [value.prop]: args[0] };
          this.draw();
          if (this.writeField()) {
            this.input!.dispatchEvent(new Event('input', { bubbles: true }));
            this.input!.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        this.element.dispatchEvent(new CustomEvent(eventName(callback), { detail: args, bubbles: true }));
      };
    }
    return props;
  }

  private draw() {
    this.drawn?.update(this.partProps(), { scope: scopeOf(this.element) });
  }

  /** The hidden field's value from the part's: true when it changed. */
  private writeField(): boolean {
    const value = this.definition().options.value;
    if (!this.input || !value) return false;
    const held = this.props[value.prop];
    const text = this.hasValuesValue && typeof held === 'number' ? (this.valuesValue[held] ?? '') : held === undefined || held === null ? '' : String(held);
    if (this.input.value === text) return false;
    this.input.value = text;
    return true;
  }

  private readSlots() {
    this.slots = {};
    for (const template of Array.from(this.element.children)) {
      if (!(template instanceof HTMLTemplateElement) || !template.dataset.zenSlot) continue;
      this.slots[template.dataset.zenSlot] = cloneFill(() => template.content);
    }
  }

  /** A morph keeps the drawn part and takes the incoming placeholder's values. */
  private beforeMorph(event: CustomEvent<{ newElement?: Element }>) {
    if (event.target !== this.element) return;
    event.preventDefault();
    const incoming = event.detail?.newElement;
    if (!incoming) return;
    for (const name of ['data-zen-part-value', 'data-zen-field-value', 'data-zen-values-value', 'data-zen-props-value']) {
      const value = incoming.getAttribute(name);
      if (value === null) this.element.removeAttribute(name);
      else if (this.element.getAttribute(name) !== value) this.element.setAttribute(name, value);
    }
  }

  /** Back to the bare placeholder: the part destroyed, what it drew and its field gone. */
  private teardown() {
    document.removeEventListener('turbo:before-morph-element', this.morph);
    document.removeEventListener('turbo:before-cache', this.cache);
    this.element.removeEventListener(SCOPE_CHANGED, this.rescope);
    this.watching?.disconnect();
    this.watching = null;
    this.drawn?.destroy();
    this.drawn = null;
    this.element.removeAttribute(READY);
    for (const child of Array.from(this.element.children)) if (child.hasAttribute(PART) || child.hasAttribute(FIELD)) child.remove();
    this.host = null;
    this.input = null;
  }
}

/**
 * Scopes its element to a pack's theme (`data-controller="zen-theme"`): the class, mode and custom
 * properties a `ThemeScope` sets, and `data-zen-pack`. Values: `pack` (a pack's id; zen's first
 * pack when it names none), `mode` (`light`, `dark` or `system`, the default) and `bleed` (the
 * scope is the whole page: no padding).
 */
export class ZenThemeController extends Controller<HTMLElement> {
  static values = { pack: String, mode: { type: String, default: 'system' }, bleed: Boolean };

  declare packValue: string;
  declare modeValue: string;
  declare bleedValue: boolean;

  private unfollow: (() => void) | null = null;
  private set: string[] = [];

  connect() {
    this.apply();
    this.unfollow = subscribeSystemMode(() => {
      if (this.modeValue === 'system') this.apply();
    });
  }

  disconnect() {
    this.unfollow?.();
    this.unfollow = null;
  }

  packValueChanged() {
    if (this.unfollow) this.apply();
  }

  modeValueChanged() {
    if (this.unfollow) this.apply();
  }

  private apply() {
    const { pack, facets } = resolveTheme({ theme: this.packValue });
    const mode = resolveMode((['light', 'dark', 'system'].includes(this.modeValue) ? this.modeValue : 'system') as ModeChoice, getSystemMode());
    const view = scopeView(facets, mode, this.bleedValue);
    const element = this.element;
    element.classList.add(view.className);
    element.setAttribute('data-mode', mode);
    element.setAttribute('data-zen-pack', pack.id);
    if (view.attrs['data-bleed']) element.setAttribute('data-bleed', view.attrs['data-bleed']);
    else element.removeAttribute('data-bleed');
    for (const name of this.set) if (!(name in view.vars)) element.style.removeProperty(name);
    for (const [name, value] of Object.entries(view.vars)) element.style.setProperty(name, value);
    this.set = Object.keys(view.vars);
    (element as Scoped)[SCOPE] = { facets, principles: pack.principles, pack: pack.id, mode };
    for (const part of Array.from(element.querySelectorAll('[data-controller~="zen"]'))) part.dispatchEvent(new CustomEvent(SCOPE_CHANGED));
  }
}

/** Registers `zen` and `zen-theme` with a Stimulus application. */
export function registerZen(application: Application): void {
  application.register('zen', ZenController);
  application.register('zen-theme', ZenThemeController);
}

/** Every part the `zen` controller can draw, by name. */
export const zenParts = (): string[] => Object.keys(domParts());
