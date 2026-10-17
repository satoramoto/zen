// The editor's facet tabs: palette, type, scale, materials and shader. Each reads the values in
// force (`resolved`) and the base's (`base`, where a double-click resets to) and writes overrides.
import { Text } from '../../primitives/Text';
import { Stack } from '../../primitives/Stack';
import { Group } from '../../layout/Group';
import { Button } from '../../components/core/Button/Button';
import { Segmented } from '../../components/core/Segmented/Segmented';
import { Select } from '../../components/core/Select/Select';
import { LAYERS, type Facets, type Mode, type Scheme } from '../../contract';
import { faces as FACES } from '../../themes/faces';
import { paletteWarnings } from '../colour';
import { SHADER_NAMES, clearOverride, getOverride, setOverride, type OverridePath, type ShaderName, type Skin } from '../skin';
import { ColourRow, FacetHead, LengthField, NumberRowField, Row } from './fields';

export interface PanelProps {
  skin: Skin;
  onChange(skin: Skin): void;
  /** The facets in force: the skin resolved. */
  resolved: Facets;
  /** The facets before the skin's overrides: its pack with its swaps. */
  base: Facets;
}

/* ---------- palette ---------- */

type ColourKey = readonly [keyof Scheme, (number | string)?];
const COLOUR_GROUPS: { name: string; roles: { name: string; key: ColourKey }[] }[] = [
  { name: 'Surfaces', roles: [0, 1, 2, 3].map((i) => ({ name: `Surface ${i}`, key: ['surface', i] as const })) },
  { name: 'Text', roles: [0, 1, 2, 3].map((i) => ({ name: `Text ${i + 1}`, key: ['text', i] as const })) },
  {
    name: 'Lines',
    roles: [
      { name: 'Border', key: ['border'] },
      { name: 'Border strong', key: ['borderStrong'] },
    ],
  },
  {
    name: 'Action & selection',
    roles: [
      { name: 'Action', key: ['action'] },
      { name: 'Action text', key: ['actionText'] },
      { name: 'Selected', key: ['selected'] },
      { name: 'Selected text', key: ['selectedText'] },
      { name: 'Accent', key: ['accent'] },
    ],
  },
  {
    name: 'States',
    roles: [
      { name: 'Success', key: ['success'] },
      { name: 'Success text', key: ['successText'] },
      { name: 'Warning', key: ['warning'] },
      { name: 'Warning text', key: ['warningText'] },
      { name: 'Danger', key: ['danger'] },
      { name: 'Danger text', key: ['dangerText'] },
    ],
  },
  {
    name: 'Hues',
    roles: [...[0, 1, 2, 3, 4].map((i) => ({ name: `Hue ${i + 1}`, key: ['hues', i] as const })), { name: 'On hue', key: ['onHue'] as const }],
  },
  {
    name: 'Roles',
    roles: [
      { name: 'Role 1', key: ['roles', 0] },
      { name: 'Role 1 text', key: ['roleText', 0] },
      { name: 'Role 2', key: ['roles', 1] },
      { name: 'Role 2 text', key: ['roleText', 1] },
    ],
  },
  {
    name: 'Keys',
    roles: [
      { name: 'White key', key: ['keys', 'white'] },
      { name: 'Black key', key: ['keys', 'black'] },
    ],
  },
];

const MODES: readonly Mode[] = ['light', 'dark'];

const pick = (scheme: Scheme, key: ColourKey): unknown => {
  const v = scheme[key[0]] as unknown;
  return key[1] === undefined ? v : (v as Record<string | number, unknown> | undefined)?.[key[1]];
};

export function PalettePanel({ skin, onChange, resolved, base, mode, onModeChange }: PanelProps & { mode: Mode; onModeChange(mode: Mode): void }) {
  const warnings = paletteWarnings(resolved.palette, mode);
  return (
    <Stack gap={4}>
      <FacetHead skin={skin} facet="palette" onChange={onChange} />
      <Row label="Editing">
        <Segmented items={['Light', 'Dark']} index={MODES.indexOf(mode)} label="Mode being edited" onChange={(i) => onModeChange(MODES[i])} />
      </Row>
      {COLOUR_GROUPS.map((g) => (
        <Group key={g.name} name={g.name} direction="column" gap={1}>
          {g.roles.map((r) => {
            const path = ['palette', mode, ...r.key.filter((k) => k !== undefined)] as unknown as OverridePath;
            return (
              <ColourRow
                key={r.name}
                skin={skin}
                name={r.name}
                path={path}
                value={pick(resolved.palette[mode], r.key)}
                base={pick(base.palette[mode], r.key)}
                onChange={onChange}
              />
            );
          })}
        </Group>
      ))}
      <Group name="Checks" direction="column" gap={1}>
        <div role="status" aria-live="polite" className="zen-theme-editor__warnings" data-part="warnings">
          {warnings.length === 0 ? (
            <Text role="body" size="label" tone="secondary">
              Contrast and separation hold.
            </Text>
          ) : (
            <ul className="zen-theme-editor__list">
              {warnings.map((w) => (
                <Text as="li" key={w} role="body" size="label" tone="primary" className="zen-theme-editor__warning">
                  {w}
                </Text>
              ))}
            </ul>
          )}
        </div>
      </Group>
    </Stack>
  );
}

/* ---------- type ---------- */

const GENERIC: Record<string, string> = {
  'system-ui': 'System UI',
  '-apple-system': 'System UI',
  'ui-monospace': 'System mono',
  'sans-serif': 'Sans-serif',
  serif: 'Serif',
  monospace: 'Monospace',
};
/** A font stack's name in a menu: its first family. */
const stackName = (stack: string) => {
  const first = stack.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  return GENERIC[first] ?? first;
};
/** Every stack zen's faces use, once each, by name. */
const STACKS: readonly string[] = [...new Set(FACES.flatMap((f) => [f.sans, f.display, f.mono, f.readout, f.math]))].sort((a, b) => stackName(a).localeCompare(stackName(b)));

const FACE_ROLES = [
  { key: 'sans', name: 'Sans', role: 'body', sample: 'Sphinx of black quartz, judge my vow' },
  { key: 'display', name: 'Display', role: 'display', sample: 'Theme editor' },
  { key: 'mono', name: 'Mono', role: 'code', sample: '{ "base": "linear" }' },
  { key: 'readout', name: 'Readout', role: 'numeral', sample: '128.00  4/4  −6.0' },
  { key: 'math', name: 'Math', role: 'math', sample: 'fₙ = n·f₁   ∑ 1/n² = π²/6' },
] as const;

const WEIGHTS = [
  { key: 'weightBody', name: 'Body weight' },
  { key: 'weightStrong', name: 'Strong weight' },
  { key: 'weightDisplay', name: 'Display weight' },
  { key: 'weightNumeral', name: 'Numeral weight' },
] as const;

/** The menu for one face: zen's stacks, plus the one in force if it is none of them. */
function stackItems(current: string) {
  const stacks = STACKS.includes(current) ? STACKS : [current, ...STACKS];
  const names = stacks.map(stackName);
  const seen = new Map<string, number>();
  const labels = names.map((n) => {
    const k = (seen.get(n) ?? 0) + 1;
    seen.set(n, k);
    return k === 1 ? n : `${n} (${k})`;
  });
  return { stacks, labels };
}

export function TypePanel({ skin, onChange, resolved, base }: PanelProps) {
  const f = resolved.faces;
  const set = (path: OverridePath, v: unknown) => onChange(setOverride(skin, path, v));
  return (
    <Stack gap={4}>
      <FacetHead skin={skin} facet="faces" onChange={onChange} />
      <Group name="Families" direction="column" gap={1}>
        {FACE_ROLES.map((r) => {
          const { stacks, labels } = stackItems(f[r.key]);
          return (
            <Row key={r.key} label={r.name}>
              <Select
                className="zen-theme-editor__select"
                items={labels}
                index={Math.max(0, stacks.indexOf(f[r.key]))}
                label={`${r.name} face`}
                title={f[r.key]}
                onChange={(i) => set(['faces', r.key], stacks[i])}
              />
            </Row>
          );
        })}
      </Group>
      <Group name="Weights" direction="column" gap={1}>
        {WEIGHTS.map((w) => (
          <Row key={w.key} label={w.name}>
            <NumberRowField label={w.name} value={f[w.key]} base={base.faces[w.key]} min={100} max={900} step={100} pattern="%d" onChange={(v) => set(['faces', w.key], v)} />
          </Row>
        ))}
      </Group>
      <Group name="Tracking and case" direction="column" gap={1}>
        <Row label="Tracking">
          <LengthField label="Tracking" raw={f.tracking} base={base.faces.tracking} unit="em" min={-0.1} max={0.2} step={0.001} onChange={(v) => set(['faces', 'tracking'], v)} />
        </Row>
        <Row label="Display tracking">
          <LengthField label="Display tracking" raw={f.trackingDisplay} base={base.faces.trackingDisplay} unit="em" min={-0.1} max={0.2} step={0.001} onChange={(v) => set(['faces', 'trackingDisplay'], v)} />
        </Row>
        <Row label="Label case">
          <Segmented
            items={['None', 'Upper']}
            index={f.labelCase === 'uppercase' ? 1 : 0}
            label="Label case"
            onChange={(i) => set(['faces', 'labelCase'], i === 1 ? 'uppercase' : 'none')}
          />
        </Row>
      </Group>
      <Group name="Specimen" direction="column" gap={2}>
        {FACE_ROLES.map((r) => (
          <Text key={r.key} role={r.role} truncate title={f[r.key]}>
            {r.sample}
          </Text>
        ))}
        <Text role="label">Label case</Text>
      </Group>
    </Stack>
  );
}

/* ---------- scale ---------- */

const SIZES = [
  { key: 'caption', name: 'Caption' },
  { key: 'body', name: 'Body' },
  { key: 'label', name: 'Label' },
  { key: 'heading', name: 'Heading' },
  { key: 'display', name: 'Display' },
  { key: 'numeral', name: 'Numeral' },
] as const;

export function ScalePanel({ skin, onChange, resolved, base }: PanelProps) {
  const s = resolved.scale;
  const set = (path: OverridePath, v: unknown) => onChange(setOverride(skin, path, v));
  return (
    <Stack gap={4}>
      <FacetHead skin={skin} facet="scale" onChange={onChange} />
      <Group name="Spacing and controls" direction="column" gap={1}>
        <Row label="Unit">
          <NumberRowField label="Spacing unit" value={s.unit} base={base.scale.unit} min={1} max={32} pattern="%d px" onChange={(v) => set(['scale', 'unit'], v)} />
        </Row>
        <Row label="Control height">
          <NumberRowField label="Control height" value={s.control} base={base.scale.control} min={12} max={96} pattern="%d px" onChange={(v) => set(['scale', 'control'], v)} />
        </Row>
      </Group>
      <Group name="Type sizes" direction="column" gap={1}>
        {SIZES.map((z) => (
          <Row key={z.key} label={z.name}>
            <NumberRowField
              label={`${z.name} size`}
              value={s.sizes[z.key]}
              base={base.scale.sizes[z.key]}
              min={6}
              max={200}
              pattern="%d px"
              onChange={(v) => set(['scale', 'sizes', z.key], v)}
            />
          </Row>
        ))}
      </Group>
      <Group name="Specimen" direction="column" gap={2}>
        {SIZES.map((z) => (
          <Text key={z.key} role={z.key} truncate>
            {z.name} {s.sizes[z.key]}
          </Text>
        ))}
        <Stack direction="row" gap={2} align="center" wrap>
          <Button label="A control" />
          <Text role="caption" tone="secondary">
            {s.control} px high, {s.unit} px unit
          </Text>
        </Stack>
      </Group>
    </Stack>
  );
}

/* ---------- materials ---------- */

const RADII = [
  { key: 'radiusControl', name: 'Control radius' },
  { key: 'radiusCard', name: 'Card radius' },
  { key: 'radiusInput', name: 'Input radius' },
  { key: 'radiusPill', name: 'Pill radius' },
] as const;
const INPUTS = ['filled', 'box', 'underline'] as const;

export function MaterialsPanel({ skin, onChange, resolved, base }: PanelProps) {
  const m = resolved.materials;
  const b = base.materials;
  const set = (path: OverridePath, v: unknown) => onChange(setOverride(skin, path, v));
  return (
    <Stack gap={4}>
      <FacetHead skin={skin} facet="materials" onChange={onChange} />
      <Group name="Shape" direction="column" gap={1}>
        {RADII.map((r) => (
          <Row key={r.key} label={r.name}>
            <LengthField label={r.name} raw={m[r.key]} base={b[r.key]} unit="px" min={0} max={48} step={1} onChange={(v) => set(['materials', r.key], v)} />
          </Row>
        ))}
        <Row label="Border width">
          <LengthField label="Border width" raw={m.borderWidth} base={b.borderWidth} unit="px" min={0} max={4} step={0.5} onChange={(v) => set(['materials', 'borderWidth'], v)} />
        </Row>
        <Row label="Fields">
          <Segmented
            items={['Filled', 'Box', 'Underline']}
            index={Math.max(0, INPUTS.indexOf(m.input))}
            label="How fields are drawn"
            onChange={(i) => set(['materials', 'input'], INPUTS[i])}
          />
        </Row>
      </Group>
      <Group name="Light" direction="column" gap={1}>
        <Row label="Light angle">
          <LengthField label="Light angle" raw={m.light} base={b.light} unit="deg" min={0} max={359} step={1} onChange={(v) => set(['materials', 'light'], v)} />
        </Row>
        <Row label="Lit radius">
          <LengthField label="Lit radius" raw={m.lit.radius} base={b.lit.radius} unit="px" min={0} max={32} step={1} onChange={(v) => set(['materials', 'lit', 'radius'], v)} />
        </Row>
        <Row label="Lit strength">
          <LengthField label="Lit strength" raw={m.lit.strength} base={b.lit.strength} unit="%" min={0} max={100} step={1} onChange={(v) => set(['materials', 'lit', 'strength'], v)} />
        </Row>
      </Group>
    </Stack>
  );
}

/* ---------- shader ---------- */

const SHADER_ITEMS = ['None', 'Water', 'Ether', 'Glass'];
const LAYER_NAMES: Record<(typeof LAYERS)[number], string> = {
  ground: 'Ground',
  base: 'Base',
  raised: 'Raised',
  float: 'Float',
  overlay: 'Overlay',
  top: 'Top',
};

export function ShaderPanel({ skin, onChange, resolved }: PanelProps) {
  const shaders = resolved.materials.shaders ?? {};
  const path: OverridePath = ['materials', 'shaders'];
  return (
    <Stack gap={4}>
      <Row label="Shaders">
        <Button label="Reset shaders" variant="quiet" disabled={getOverride(skin, path) === undefined} onPress={() => onChange(clearOverride(skin, path))} />
      </Row>
      <Group name="Per layer" direction="column" gap={1}>
        {LAYERS.map((layer) => {
          const at = shaders[layer];
          return (
            <Row key={layer} label={LAYER_NAMES[layer]}>
              <Select
                className="zen-theme-editor__select"
                items={SHADER_ITEMS}
                index={at ? SHADER_NAMES.indexOf(at) + 1 : 0}
                label={`${LAYER_NAMES[layer]} layer shader`}
                onChange={(i) => onChange(setOverride(skin, ['materials', 'shaders', layer], i === 0 ? null : (SHADER_NAMES[i - 1] as ShaderName)))}
              />
            </Row>
          );
        })}
      </Group>
    </Stack>
  );
}
