import { useEffect, useId, useMemo, useState } from 'react';
import { Text } from '../../primitives/Text';
import { Stack } from '../../primitives/Stack';
import { Tabs, type TabItem } from '../../layout/Tabs';
import { Select } from '../../components/core/Select/Select';
import type { Mode } from '../../contract';
import { packs } from '../../themes/packs';
import { FACET_NAMES, baseFacets, isCustom, rebaseSkin, resolveSkin, type Skin } from '../skin';
import { FACET_TITLES, Row, facetDiffers } from './fields';
import { ImportExport, type Status } from './ImportExport';
import { MaterialsPanel, PalettePanel, ScalePanel, ShaderPanel, TypePanel } from './panels';
import './ThemeEditor.css';

export interface ThemeEditorProps {
  /** The skin being edited. The editor is controlled: it never keeps a skin of its own. */
  skin: Skin;
  /** Every edit, import and reset, as a new skin (in normal form). The host keeps it. */
  onChange(skin: Skin): void;
  /** Which palette mode is edited. Default `'dark'`. */
  mode?: Mode;
  /** Hears the mode the person switches to. Leave it out and the editor keeps the mode itself. */
  onModeChange?(mode: Mode): void;
  className?: string;
}

type TabId = 'palette' | 'faces' | 'scale' | 'materials' | 'shader';

/**
 * **Job.** Make a theme your own: start from a pack, swap a whole facet for another, or change
 * single values (a colour, a face, a size, a radius), and take the result away as a skin file or
 * bring one in. It edits a `Skin` (skin.ts) and nothing else: the host owns where the skin is kept
 * (`SkinProvider`, an app's settings) and wears it (`SkinScope`). Put the editor inside the scope
 * that wears the skin, and it re-skins itself as you edit; its specimens read the scope around
 * them.
 *
 * **Behaviour.** The head names the skin and its pack, picks the base pack (`rebaseSkin`), and
 * holds Export (a `<id>.zen-skin.json` download), Copy JSON, Import (a file or pasted JSON, read
 * by `parseSkin`: a bad one leaves the skin alone and lists what is wrong in the status line), and
 * Reset (back to the pack as it ships). Under it, one tab per facet: Palette, Type, Scale,
 * Materials, and Shader when the materials draw a shader on any layer. Every tab can wear another
 * named facet (From) and put its own back (Reset), which is offered only while the facet differs.
 * A colour row is a swatch (the system colour picker), its hex, and H/S/L fields; a row that is
 * overridden offers its own Reset. Every number field drags, steps with the arrows and takes
 * typing; a double-click puts back the base's value. Under the palette, the contrast and
 * separation checks (`paletteWarnings`) in plain words, politely announced.
 *
 * **Layout.** One column, at most the editor's width, that wraps each row's controls and moves
 * labels above them in a narrow container (down to 320 px). No panels of its own: rows sit under
 * `Group` headers. No outer margin.
 *
 * **Parts** (`data-part`): `head`, `actions`, `paste`, `status`, `tabs` (zen's `Tabs`), `panel`,
 * `row` (`row-label`, `row-control`), `swatch`, `hex`, `warnings`.
 *
 * **Tuning knobs**
 * - `--zen-theme-editor-width`: the column's widest.
 * - `--zen-theme-editor-label-w`: the label column's width in a wide container.
 */
export function ThemeEditor({ skin, onChange, mode, onModeChange, className }: ThemeEditorProps) {
  const [ownMode, setOwnMode] = useState<Mode>(mode ?? 'dark');
  useEffect(() => {
    if (mode) setOwnMode(mode);
  }, [mode]);
  const editing: Mode = onModeChange ? (mode ?? 'dark') : ownMode;
  const setMode = (m: Mode) => (onModeChange ? onModeChange(m) : setOwnMode(m));

  const [tab, setTab] = useState<TabId>('palette');
  const [status, setStatus] = useState<Status>(null);
  const uid = useId();

  const resolved = useMemo(() => resolveSkin(skin).facets, [skin]);
  const base = useMemo(() => baseFacets(skin), [skin]);
  const pack = packs.find((p) => p.id === skin.base);
  const packLabel = pack?.label ?? skin.base;
  const custom = isCustom(skin);

  // The shader tab stays while the base draws a shader, so turning every layer off doesn't hide it.
  const hasShaders = Object.keys(resolved.materials.shaders ?? {}).length > 0 || base.materials.shaders !== undefined;
  const items: TabItem[] = [
    ...FACET_NAMES.map((f) => {
      const changed = facetDiffers(skin, f);
      return { id: f, label: tabLabel(FACET_TITLES[f], changed), name: changed ? `${FACET_TITLES[f]}, changed` : FACET_TITLES[f] };
    }),
    ...(hasShaders ? [{ id: 'shader', label: 'Shader', name: 'Shader' }] : []),
  ];
  const shown: TabId = tab === 'shader' && !hasShaders ? 'palette' : tab;
  const tabDomId = (id: string) => `${uid}-tab-${id}`;
  const panelId = `${uid}-panel`;
  // An edit makes the last action's status stale.
  const edit = (next: Skin) => {
    setStatus(null);
    onChange(next);
  };
  const panel = { skin, onChange: edit, resolved, base };

  const packIndex = packs.findIndex((p) => p.id === skin.base);

  return (
    <Stack as="section" gap={4} className={`zen-theme-editor${className ? ` ${className}` : ''}`} aria-label="Theme editor" data-part="root">
      <Stack gap={3} className="zen-theme-editor__head" data-part="head">
        <Stack gap={1}>
          <Text as="h2" role="heading" truncate title={skin.label}>
            {skin.label}
          </Text>
          <Text role="body" size="label" tone="secondary" truncate>
            {`Based on ${packLabel}${custom ? ' · changed' : ', unchanged'}`}
          </Text>
        </Stack>
        <Row label="Base pack">
          <Select
            className="zen-theme-editor__select"
            items={packs.map((p) => p.label)}
            index={Math.max(0, packIndex)}
            label="Base pack"
            onChange={(i) => edit(rebaseSkin(skin, packs[i].id))}
          />
        </Row>
        <ImportExport skin={skin} onChange={onChange} status={status} onStatus={setStatus} />
      </Stack>
      <Stack gap={4}>
        <Tabs name="Theme facets" items={items} value={shown} onChange={(id) => setTab(id as TabId)} panelId={panelId} tabId={tabDomId} />
        <div role="tabpanel" id={panelId} aria-labelledby={tabDomId(shown)} className="zen-theme-editor__panel" data-part="panel">
          {shown === 'palette' && <PalettePanel {...panel} mode={editing} onModeChange={setMode} />}
          {shown === 'faces' && <TypePanel {...panel} />}
          {shown === 'scale' && <ScalePanel {...panel} />}
          {shown === 'materials' && <MaterialsPanel {...panel} />}
          {shown === 'shader' && <ShaderPanel {...panel} />}
        </div>
      </Stack>
    </Stack>
  );
}

/** A tab's label, marked while its facet differs from the pack's. */
function tabLabel(title: string, changed: boolean) {
  return changed ? (
    <>
      {title}
      <span className="zen-theme-editor__changed" aria-hidden="true">
        {' '}•
      </span>
    </>
  ) : (
    title
  );
}

export default ThemeEditor;
