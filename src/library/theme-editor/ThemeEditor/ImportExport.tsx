// The editor's actions on the whole skin: export it (a download, or the clipboard), import one (a
// file, or pasted JSON), or reset to the pack. The host owns persistence; this only calls onChange.
import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Text } from '../../primitives/Text';
import { Stack } from '../../primitives/Stack';
import { Button } from '../../components/core/Button/Button';
import { isCustom, parseSkin, serializeSkin, skinFromPack, type Skin } from '../skin';
import { packs } from '../../themes/packs';

/** What the last action did, for the status region. */
export type Status = { tone: 'ok'; text: string } | { tone: 'error'; text: string; errors?: string[] } | null;

/** The most errors listed at once; the rest are counted. */
const MAX_ERRORS = 8;

/** A file name made from a skin id: letters, digits, dots, dashes and underscores only. */
export const fileNameFor = (skin: Skin) => `${skin.id.replace(/[^\w.-]+/g, '-') || 'skin'}.zen-skin.json`;

function download(name: string, text: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  } catch {
    return false;
  }
}

export function ImportExport({ skin, onChange, status, onStatus }: { skin: Skin; onChange(skin: Skin): void; status: Status; onStatus(status: Status): void }) {
  const file = useRef<HTMLInputElement>(null);
  const [pasting, setPasting] = useState(false);
  const [draft, setDraft] = useState('');
  const pasteId = useId();
  const pack = packs.find((p) => p.id === skin.base);
  const packLabel = pack?.label ?? skin.base;

  const take = (text: string, from: string) => {
    const read = parseSkin(text);
    if (read.ok) {
      onChange(read.skin);
      onStatus({ tone: 'ok', text: `Imported ${read.skin.label} from ${from}.` });
      return true;
    }
    onStatus({ tone: 'error', text: `That ${from} isn't a skin this editor can wear; the current skin is kept.`, errors: read.errors });
    return false;
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!f) return;
    try {
      take(await f.text(), 'file');
    } catch {
      onStatus({ tone: 'error', text: `Couldn't read ${f.name}; the current skin is kept.` });
    }
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
      await navigator.clipboard.writeText(serializeSkin(skin));
      onStatus({ tone: 'ok', text: 'Copied the skin JSON to the clipboard.' });
    } catch {
      onStatus({ tone: 'error', text: "Couldn't reach the clipboard here. Use Export to save a file instead." });
    }
  };

  const exportFile = () => {
    const name = fileNameFor(skin);
    onStatus(
      download(name, serializeSkin(skin)) ? { tone: 'ok', text: `Exported ${name}.` } : { tone: 'error', text: "Couldn't start a download here. Use Copy JSON instead." },
    );
  };

  const custom = isCustom(skin) || skin.id !== skin.base;
  const shown = status?.tone === 'error' ? (status.errors ?? []) : [];

  return (
    <Stack gap={2}>
      <Stack direction="row" gap={2} wrap align="center" className="zen-theme-editor__actions" data-part="actions">
        <Button label="Export" name={`Export ${fileNameFor(skin)}`} onPress={exportFile} />
        <Button label="Copy JSON" onPress={copy} />
        <Button label="Import file" onPress={() => file.current?.click()} />
        <Button label="Paste JSON" pressed={pasting} chosen={pasting} variant="quiet" controls={pasteId} onPress={() => setPasting((p) => !p)} />
        <Button label="Reset" name={`Reset to ${packLabel}`} variant="quiet" disabled={!custom} onPress={() => {
          onChange(skinFromPack(skin.base));
          onStatus({ tone: 'ok', text: `Back to ${packLabel} as it ships.` });
        }} />
        <input ref={file} type="file" accept=".json,application/json" hidden aria-label="Import a skin file" onChange={onFile} />
      </Stack>
      {pasting && (
        <Stack gap={2} id={pasteId} className="zen-theme-editor__paste" data-part="paste">
          <Text
            as="textarea"
            role="code"
            className="zen-theme-editor__textarea"
            aria-label="Skin JSON to import"
            placeholder='{ "format": "zen-skin", "version": 1, … }'
            rows={8}
            spellCheck={false}
            value={draft}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.currentTarget.value)}
          />
          <Stack direction="row" gap={2} wrap>
            <Button label="Import pasted JSON" variant="primary" disabled={!draft.trim()} onPress={() => {
              if (take(draft, 'JSON')) {
                setDraft('');
                setPasting(false);
              }
            }} />
            <Button label="Cancel" variant="quiet" onPress={() => setPasting(false)} />
          </Stack>
        </Stack>
      )}
      <div role="status" aria-live="polite" className="zen-theme-editor__status" data-part="status" data-tone={status?.tone}>
        {status && (
          <Stack gap={1}>
            <Text role="body" size="label" tone={status.tone === 'error' ? 'danger' : 'secondary'}>
              {status.text}
            </Text>
            {shown.length > 0 && (
              <ul className="zen-theme-editor__list">
                {shown.slice(0, MAX_ERRORS).map((e) => (
                  <Text as="li" key={e} role="code" tone="primary" className="zen-theme-editor__error">
                    {e}
                  </Text>
                ))}
                {shown.length > MAX_ERRORS && (
                  <Text as="li" role="body" size="label" tone="secondary">
                    and {shown.length - MAX_ERRORS} more
                  </Text>
                )}
              </ul>
            )}
          </Stack>
        )}
      </div>
    </Stack>
  );
}
