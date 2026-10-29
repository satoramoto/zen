import { useEffect, useId, useLayoutEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../../components/core/Button/Button';
import { Disclosure } from '../../../components/core/Disclosure/Disclosure';
import { Stack } from '../../../primitives/Stack';
import { Surface } from '../../../primitives/Surface';
import { Text, textView } from '../../../primitives/Text';
import { Tag } from '../LeadTable/LeadTable';
import './DraftFlow.css';

/** One proposed message to start from: a subject, a plain-text body and an optional tag (an angle word, a tone). */
export interface DraftProposal {
  id: string;
  subject: string;
  body: string;
  tag?: string | null;
}

/** The working draft: what the writer has, the proposal `id` it came `from`, and whether it is approved to send. */
export interface DraftWorking {
  subject: string;
  body: string;
  from?: string | null;
  approved: boolean;
}

/** Every built-in word, each overridable. */
export interface DraftFlowWords {
  use: string;
  save: string;
  saved: string;
  saving: string;
  unsaved: string;
  approve: string;
  editAgain: string;
  markSent: string;
  startOver: string;
  backToDraft: string;
  showAll: string;
  showLess: string;
  showEmail: string;
  copy: string;
  copied: string;
  readyHeading: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  sent: string;
  empty: string;
  failed: string;
}

const WORDS: DraftFlowWords = {
  use: 'Use this',
  save: 'Save',
  saved: 'Saved',
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
  approve: 'Approve',
  editAgain: 'Edit again',
  markSent: 'Mark as sent',
  startOver: 'Start over from a proposal',
  backToDraft: 'Back to the draft',
  showAll: 'Show all',
  showLess: 'Show less',
  showEmail: 'Show the email',
  copy: 'Copy',
  copied: 'Copied',
  readyHeading: "This is the email you're going to send",
  from: 'Started from',
  to: 'To',
  subject: 'Subject',
  body: 'Body',
  sent: 'Sent',
  empty: 'No proposals yet.',
  failed: 'Something went wrong.',
};

export interface DraftFlowProps {
  /** The messages to start from, in order. */
  proposals: readonly DraftProposal[];
  /** The working draft, once one is in use. Approved means ready to send. */
  draft?: DraftWorking | null;
  /** The recipient, shown on the ready and sent email. */
  to?: string | null;
  /** Set once the message has gone; `at` is shown as written. */
  sent?: { at: string } | null;
  /** "Use this" on a proposal: the app makes it the working draft. */
  onUse(id: string): Promise<void> | void;
  /** Saves the draft's edits (on blur and on Save). */
  onSave(next: { subject: string; body: string }): Promise<void> | void;
  /** Approve (`true`) or Edit again (`false`). */
  onApprove(approved: boolean): Promise<void> | void;
  /** "Mark as sent". */
  onSent(): Promise<void> | void;
  /** Any built-in word, in the app's language. */
  words?: Partial<DraftFlowWords>;
  /** The app is working: every action is shown but not pressable, and the root is `aria-busy`. */
  busy?: boolean;
  className?: string;
}

type Stage = 'proposals' | 'draft' | 'ready' | 'sent';

const messageOf = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : typeof error === 'string' && error ? error : fallback;

/** One action at a time per stage: pending while it runs, its rejection's message kept for the error line. */
function useRun(fallback: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void> | void): Promise<boolean> => {
    setPending(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(messageOf(e, fallback));
      return false;
    } finally {
      setPending(false);
    }
  };
  return { pending, error, run };
}

/** The stage's quiet status line: an error in danger ink, anything else muted. Holds its line while empty. */
function StatusLine({ text, error }: { text: string | null; error: boolean }) {
  return (
    <Text as="p" role="caption" tone={error ? 'danger' : 'muted'} className="lib-draft__status" aria-live="polite" data-part="status" data-error={error ? '' : undefined}>
      {text}
    </Text>
  );
}

/**
 * **Job.** Write one outgoing message from proposals, in four stages the props decide: no working
 * draft shows the **proposals** to pick from; a working draft not approved is the **draft** to edit;
 * an approved one is **ready**, read back as it will go; `sent` is **sent**. The app holds the data
 * and saves; the view keeps only the edits in progress. It knows a message, never what it is for.
 *
 * **Behaviour.** Proposals: one card each (subject, tag, body clamped to about eight lines with
 * Show all), two side by side from 44rem of container width, stacked under; "Use this" calls
 * `onUse`. Draft: subject field and auto-growing body, saved by `onSave` on blur and on Save, with
 * a quiet Unsaved changes / Saving… / Saved / error line (`aria-live`); Approve is the outlined key
 * while there are unsaved edits but stays pressable, saves them first and approves only once the
 * save succeeds. A new `draft` from the app replaces the fields only when they hold no unsaved edits
 * (the echo of a save never does). "Start over from a proposal" saves, then shows the proposals
 * again (staying put if the save fails), keeping the draft (Back to the draft returns) until another
 * is used. Ready: the
 * heading, To / Subject / Body read-only, each with a copy button (the Clipboard API, else the text
 * is selected); Edit again calls `onApprove(false)`, Mark as sent `onSent`. Sent: "Sent <at>" and the
 * final email under a disclosure, collapsed. A rejected promise shows its message in the stage's
 * status line and the stage stays as it was. `busy` holds every action.
 *
 * **Parts** (`data-part`). `root` (`data-stage`); `proposals`, `proposal`, `tag`, `excerpt`,
 * `toggle`, `use`, `empty`; `editor`, `source`, `subject`, `body`, `save`, `approve`, `start-over`;
 * `ready`, `heading`, `email`, `row`, `value`, `copy`, `edit`, `send`; `sent-line`; `status`.
 *
 * **Tuning knobs.** `--lib-draft-clamp-lines` (a proposal's visible lines, default 8),
 * `--lib-draft-body-lines` (the body field's least height in lines, default 8).
 */
export function DraftFlow({ proposals, draft, to, sent, onUse, onSave, onApprove, onSent, words: own, busy = false, className }: DraftFlowProps) {
  const words = { ...WORDS, ...own };
  const [choosing, setChoosing] = useState(false);
  const stage: Stage = sent ? 'sent' : draft?.approved ? 'ready' : draft && !choosing ? 'draft' : 'proposals';
  const source = draft?.from ? proposals.find((p) => p.id === draft.from) : undefined;
  const sourceName = draft?.from ? (source ? source.tag || source.subject : draft.from) : null;

  return (
    <Stack
      as="section"
      direction="column"
      gap={5}
      className={`lib-draft${className ? ` ${className}` : ''}`}
      data-part="root"
      data-stage={stage}
      aria-busy={busy || undefined}
    >
      {stage === 'proposals' ? (
        <ProposalsStage
          proposals={proposals}
          words={words}
          busy={busy}
          onUse={onUse}
          onUsed={() => setChoosing(false)}
          onBack={draft ? () => setChoosing(false) : undefined}
        />
      ) : null}
      {stage === 'draft' && draft ? (
        <DraftStage draft={draft} sourceName={sourceName} words={words} busy={busy} onSave={onSave} onApprove={onApprove} onStartOver={() => setChoosing(true)} />
      ) : null}
      {stage === 'ready' && draft ? <ReadyStage draft={draft} to={to} words={words} busy={busy} onApprove={onApprove} onSent={onSent} /> : null}
      {stage === 'sent' && sent ? <SentStage at={sent.at} draft={draft} to={to} words={words} /> : null}
    </Stack>
  );
}

// ── Proposals ────────────────────────────────────────────────────────────────

function ProposalsStage({
  proposals,
  words,
  busy,
  onUse,
  onUsed,
  onBack,
}: {
  proposals: readonly DraftProposal[];
  words: DraftFlowWords;
  busy: boolean;
  onUse: DraftFlowProps['onUse'];
  onUsed: () => void;
  onBack?: () => void;
}) {
  const { pending, error, run } = useRun(words.failed);
  const use = async (id: string) => {
    if (await run(() => onUse(id))) onUsed();
  };
  return (
    <Stack direction="column" gap={3}>
      {proposals.length === 0 ? (
        <Text as="p" role="body" tone="muted" data-part="empty">
          {words.empty}
        </Text>
      ) : (
        <div className="lib-draft__proposals" data-part="proposals">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} words={words} disabled={busy || pending} onUse={() => void use(p.id)} />
          ))}
        </div>
      )}
      {onBack ? (
        <span data-part="back">
          <Button label={words.backToDraft} variant="quiet" disabled={busy || pending} onPress={onBack} />
        </span>
      ) : null}
      <StatusLine text={error} error={error !== null} />
    </Stack>
  );
}

function ProposalCard({ proposal, words, disabled, onUse }: { proposal: DraftProposal; words: DraftFlowWords; disabled: boolean; onUse: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const excerpt = useRef<HTMLElement>(null);
  const id = useId();

  // Whether the clamp hides anything: measured on mount and whenever the card's width changes.
  useLayoutEffect(() => {
    const el = excerpt.current;
    if (!el || expanded) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded, proposal.body]);

  return (
    <Surface as="article" layer="raised" border radius="card" className="lib-draft__proposal" aria-labelledby={`${id}-subject`} data-part="proposal">
      <Stack direction="column" gap={3} className="lib-draft__proposal-inner">
        <Stack direction="row" gap={2} align="start" justify="between" className="lib-draft__proposal-head">
          <Text as="h3" id={`${id}-subject`} role="body" weight="strong" tone="primary" className="lib-draft__wrap">
            {proposal.subject}
          </Text>
          {proposal.tag ? <Tag tone="secondary">{proposal.tag}</Tag> : null}
        </Stack>
        <Text
          as="p"
          ref={excerpt}
          id={`${id}-body`}
          role="body"
          tone="secondary"
          className="lib-draft__excerpt"
          data-part="excerpt"
          data-expanded={expanded ? '' : undefined}
        >
          {proposal.body}
        </Text>
        <Stack direction="row" gap={2} align="center" justify="between" wrap className="lib-draft__proposal-foot">
          {overflows || expanded ? (
            <span data-part="toggle">
              <Button
                label={expanded ? words.showLess : words.showAll}
                variant="quiet"
                controls={`${id}-body`}
                expanded={expanded}
                onPress={() => setExpanded((e) => !e)}
              />
            </span>
          ) : (
            <span />
          )}
          <span data-part="use">
            <Button label={words.use} name={`${words.use}: ${proposal.subject}`} disabled={disabled} onPress={onUse} />
          </span>
        </Stack>
      </Stack>
    </Surface>
  );
}

// ── Draft ────────────────────────────────────────────────────────────────────

type Pair = { subject: string; body: string };
const same = (a: Pair, b: Pair) => a.subject === b.subject && a.body === b.body;
type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved' } | { kind: 'error'; message: string };

function DraftStage({
  draft,
  sourceName,
  words,
  busy,
  onSave,
  onApprove,
  onStartOver,
}: {
  draft: DraftWorking;
  sourceName: string | null;
  words: DraftFlowWords;
  busy: boolean;
  onSave: DraftFlowProps['onSave'];
  onApprove: DraftFlowProps['onApprove'];
  onStartOver: () => void;
}) {
  const id = useId();
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  // The last value known to be saved: the app's draft, or what `onSave` last accepted.
  const [saved, setSaved] = useState<Pair>({ subject: draft.subject, body: draft.body });
  const [state, setState] = useState<SaveState>({ kind: 'idle' });
  const [pending, setPending] = useState(false);
  const inflight = useRef<{ key: string; value: Pair; promise: Promise<boolean> } | null>(null);
  // The fields and the saved value as of the last render, for the resync below to read.
  const latest = useRef({ fields: { subject, body }, saved });
  useLayoutEffect(() => {
    latest.current = { fields: { subject, body }, saved };
  });

  // The app's draft changed. It is now the saved value; it replaces the fields only when they hold
  // no unsaved edits, and never when it is the echo of the save in flight (typing may have gone on).
  useEffect(() => {
    const prop = { subject: draft.subject, body: draft.body };
    const { fields, saved: was } = latest.current;
    if (same(prop, was)) return;
    setSaved(prop);
    const echo = inflight.current !== null && same(prop, inflight.current.value);
    if (!echo && same(fields, was)) {
      setSubject(prop.subject);
      setBody(prop.body);
    }
  }, [draft.subject, draft.body]);

  const dirty = !same({ subject, body }, saved);

  const save = (): Promise<boolean> => {
    if (!dirty) return Promise.resolve(true);
    const next = { subject, body };
    const key = JSON.stringify(next);
    if (inflight.current?.key === key) return inflight.current.promise;
    setState({ kind: 'saving' });
    const promise = (async () => {
      try {
        await onSave(next);
        setSaved(next);
        setState({ kind: 'saved' });
        return true;
      } catch (e) {
        setState({ kind: 'error', message: messageOf(e, words.failed) });
        return false;
      } finally {
        if (inflight.current?.key === key) inflight.current = null;
      }
    })();
    inflight.current = { key, value: next, promise };
    return promise;
  };

  // Leaving for the proposals saves first and stays here if the save fails, so no edit is lost.
  const startOver = async () => {
    setPending(true);
    try {
      if (await save()) onStartOver();
    } finally {
      setPending(false);
    }
  };

  const approve = async () => {
    setPending(true);
    try {
      if (!(await save())) return;
      try {
        await onApprove(true);
      } catch (e) {
        setState({ kind: 'error', message: messageOf(e, words.failed) });
      }
    } finally {
      setPending(false);
    }
  };

  const status =
    state.kind === 'error'
      ? state.message
      : state.kind === 'saving'
        ? words.saving
        : dirty
          ? words.unsaved
          : state.kind === 'saved'
            ? words.saved
            : null;
  const lines = Math.max(6, body.split('\n').length + 1);
  const bodyText = textView({ role: 'body', tone: 'primary', className: 'lib-draft__field lib-draft__textarea' });
  // A save in flight doesn't disable the keys: the blur that starts it comes from the press itself
  // (mousedown moves focus), which would swallow the click. Each key waits for that save instead.
  const held = busy || pending;

  return (
    <Stack direction="column" gap={4} className="lib-draft__editor" data-part="editor">
      {sourceName ? (
        <Text as="p" role="caption" tone="muted" data-part="source">
          {words.from} {sourceName}
        </Text>
      ) : null}
      <Stack direction="column" gap={1}>
        <Text as="label" htmlFor={`${id}-subject`} role="label" tone="muted">
          {words.subject}
        </Text>
        <Text
          as="input"
          id={`${id}-subject`}
          type="text"
          role="body"
          tone="primary"
          className="lib-draft__field lib-draft__input"
          value={subject}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.currentTarget.value)}
          onBlur={() => void save()}
          spellCheck
          data-part="subject"
        />
      </Stack>
      <Stack direction="column" gap={1}>
        <Text as="label" htmlFor={`${id}-body`} role="label" tone="muted">
          {words.body}
        </Text>
        {/* Text's look on a plain textarea: `<Text as="textarea">` would hand it a children slot,
            which a controlled textarea can't take. */}
        <textarea
          {...bodyText.attrs}
          id={`${id}-body`}
          rows={lines}
          className={bodyText.className}
          value={body}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.currentTarget.value)}
          onBlur={() => void save()}
          spellCheck
          data-part="body"
        />
      </Stack>
      <StatusLine text={status} error={state.kind === 'error'} />
      <Stack direction="row" gap={2} align="center" justify="between" wrap>
        <span data-part="start-over">
          <Button label={words.startOver} variant="quiet" disabled={held} onPress={() => void startOver()} />
        </span>
        <Stack direction="row" gap={2} align="center" wrap>
          <span data-part="save">
            <Button label={words.save} disabled={held} onPress={() => void save()} />
          </span>
          {/* The outlined key while edits are unsaved. Pressing saves them first (or waits for the save
              in flight) and approves only once it succeeds, so what is approved is what was saved; while
              it runs the key is not pressable. */}
          <span data-part="approve" data-unsaved={dirty ? '' : undefined}>
            <Button label={words.approve} variant={dirty ? 'secondary' : 'primary'} disabled={held} onPress={() => void approve()} />
          </span>
        </Stack>
      </Stack>
    </Stack>
  );
}

// ── Ready and Sent ───────────────────────────────────────────────────────────

/** Copies `text`; without the Clipboard API (or when it refuses) selects `node`'s text for the reader to copy. */
async function copyText(text: string, node: HTMLElement | null): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('no clipboard');
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const selection = node ? window.getSelection() : null;
    if (node && selection) {
      selection.removeAllRanges();
      selection.selectAllChildren(node);
    }
    return false;
  }
}

function EmailRow({ label, value, words, copy, multiline }: { label: string; value: string; words: DraftFlowWords; copy: boolean; multiline?: boolean }) {
  const [copied, setCopied] = useState(false);
  const node = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <div className="lib-draft__row" data-part="row" data-multiline={multiline ? '' : undefined}>
      <Text as="dt" role="label" tone="muted" className="lib-draft__row-label">
        {label}
      </Text>
      <Text as="dd" ref={node} role="body" tone="primary" className="lib-draft__value" data-part="value">
        {value}
      </Text>
      {copy ? (
        <span className="lib-draft__copy" data-part="copy">
          <Button
            label={copied ? words.copied : words.copy}
            name={`${words.copy} ${label}`}
            variant="quiet"
            onPress={() => void copyText(value, node.current).then((ok) => setCopied(ok))}
          />
        </span>
      ) : null}
    </div>
  );
}

function Email({ draft, to, words, copy }: { draft: DraftWorking; to?: string | null; words: DraftFlowWords; copy: boolean }) {
  return (
    <Surface as="dl" layer="raised" border radius="card" className="lib-draft__email" data-part="email">
      {to ? <EmailRow label={words.to} value={to} words={words} copy={copy} /> : null}
      <EmailRow label={words.subject} value={draft.subject} words={words} copy={copy} />
      <EmailRow label={words.body} value={draft.body} words={words} copy={copy} multiline />
    </Surface>
  );
}

function ReadyStage({
  draft,
  to,
  words,
  busy,
  onApprove,
  onSent,
}: {
  draft: DraftWorking;
  to?: string | null;
  words: DraftFlowWords;
  busy: boolean;
  onApprove: DraftFlowProps['onApprove'];
  onSent: DraftFlowProps['onSent'];
}) {
  const { pending, error, run } = useRun(words.failed);
  return (
    <Stack direction="column" gap={4} data-part="ready">
      <Text as="h2" role="heading" tone="primary" data-part="heading">
        {words.readyHeading}
      </Text>
      <Email draft={draft} to={to} words={words} copy />
      <StatusLine text={error} error={error !== null} />
      <Stack direction="row" gap={2} align="center" justify="between" wrap>
        <span data-part="edit">
          <Button label={words.editAgain} disabled={busy || pending} onPress={() => void run(() => onApprove(false))} />
        </span>
        <span data-part="send">
          <Button label={words.markSent} variant="primary" disabled={busy || pending} onPress={() => void run(onSent)} />
        </span>
      </Stack>
    </Stack>
  );
}

function SentStage({ at, draft, to, words }: { at: string; draft?: DraftWorking | null; to?: string | null; words: DraftFlowWords }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <Stack direction="column" gap={3}>
      <Stack direction="row" gap={2} align="center">
        {draft ? <Disclosure aria-label={words.showEmail} size="small" expanded={open} controls={`${id}-email`} onChange={setOpen} /> : null}
        <Text as="p" role="body" tone="secondary" data-part="sent-line">
          {words.sent} {at}
        </Text>
      </Stack>
      {draft ? (
        <div id={`${id}-email`} hidden={!open}>
          <Email draft={draft} to={to} words={words} copy={false} />
        </div>
      ) : null}
    </Stack>
  );
}
