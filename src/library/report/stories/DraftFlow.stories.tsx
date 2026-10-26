import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme, withStoryFrame } from '../../storybook';
import { DraftFlow, type DraftFlowProps, type DraftProposal, type DraftWorking } from '../view/DraftFlow/DraftFlow';

const PROPOSALS: DraftProposal[] = [
  {
    id: 'warm',
    subject: 'A quick introduction',
    tag: 'warm',
    body: [
      'Hi Sam,',
      '',
      'I came across your work last month and wanted to say how much I liked the way you put the spring programme together.',
      '',
      'We run a small studio that does much the same kind of thing at a different scale, and I think there could be a good fit between what you plan for next year and what we already make.',
      '',
      'Would you be open to a twenty-minute call some time in the next few weeks? I can send a short note first with what we have in mind, so the call is quick.',
      '',
      'Either way, thanks for reading, and good luck with the season.',
      '',
      'Best,',
      'Alex',
    ].join('\n'),
  },
  {
    id: 'direct',
    subject: 'Twenty minutes in November?',
    tag: 'direct',
    body: ['Hi Sam,', '', 'Short one: we would like to work with you next year. Could we talk for twenty minutes in November?', '', 'Alex'].join('\n'),
  },
  {
    id: 'curious',
    subject: 'A question about next year',
    body: ['Hi Sam,', '', 'How do you usually choose who you work with for the next season? I would love to know when the right time to get in touch is.', '', 'Thanks,', 'Alex'].join('\n'),
  },
];

/**
 * Types into a field as a user would. A page without window focus (a background tab) fires no focus
 * events, so user-event never prepares the field and React misses the edits; a focus event sent by
 * hand prepares it. In a focused page it changes nothing.
 */
async function typeInto(field: HTMLElement, text: string, { clear = false } = {}) {
  fireEvent.focus(field);
  if (clear) await userEvent.clear(field);
  await userEvent.type(field, text);
}

const DRAFT: DraftWorking ={ subject: PROPOSALS[1]!.subject, body: PROPOSALS[1]!.body, from: 'direct', approved: false };
const TO = 'sam@example.com';

const meta: Meta<typeof DraftFlow> = {
  title: 'Design OS/Report/Draft Flow',
  component: DraftFlow,
  decorators: [withStoryFrame, withLibraryTheme],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'One outgoing message written from proposals, in four stages the props decide: the proposals to pick from (no draft), the draft to edit (saved on blur and on Save), ready to send (approved: read back with copy buttons) and sent. The app holds the data and saves; a rejected promise shows its message in the stage’s status line.',
      },
    },
  },
  args: {
    proposals: PROPOSALS,
    draft: null,
    to: TO,
    sent: null,
    onUse: fn(),
    onSave: fn(),
    onApprove: fn(),
    onSent: fn(),
  },
  render: (args) => (
    <div style={{ maxWidth: '64rem' }}>
      <DraftFlow {...args} />
    </div>
  ),
};
export default meta;

type Story = StoryObj<typeof DraftFlow>;

/** Stage 1: no working draft. A card per proposal; the long one is clamped with Show all. */
export const Proposals: Story = {
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await expect(canvasElement.querySelectorAll('[data-part="proposal"]')).toHaveLength(PROPOSALS.length);
    const toggle = await c.findByRole('button', { name: 'Show all' });
    await userEvent.click(toggle);
    await expect(c.getByRole('button', { name: 'Show less' })).toBeTruthy();
    await userEvent.click(c.getByRole('button', { name: `Use this: ${PROPOSALS[0]!.subject}` }));
    await expect(args.onUse).toHaveBeenCalledWith('warm');
  },
};

/** Stage 1 with nothing to pick from. */
export const NoProposals: Story = {
  args: { proposals: [] },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('No proposals yet.')).toBeTruthy();
  },
};

/** Stage 2: a working draft. Edits save on blur and on Save; Approve saves unsaved edits first. */
export const Draft: Story = {
  args: { draft: DRAFT },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await expect(c.getByText(`Started from ${PROPOSALS[1]!.tag}`)).toBeTruthy();
    const subject = c.getByLabelText('Subject');
    await typeInto(subject, 'Twenty minutes next month?', { clear: true });
    await userEvent.tab();
    // A page without window focus (a background tab) fires no blur on a focus move; send it by hand.
    // A second save of the same edits is a no-op.
    if (!document.hasFocus()) fireEvent.focusOut(subject);
    await waitFor(() => expect(args.onSave).toHaveBeenCalledWith({ subject: 'Twenty minutes next month?', body: DRAFT.body }));
    await expect(await c.findByText('Saved')).toHaveAttribute('aria-live', 'polite');
    await typeInto(c.getByLabelText('Body'), '\nP.S. Thanks.');
    await userEvent.click(c.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(args.onApprove).toHaveBeenCalledWith(true));
    await expect(args.onSave).toHaveBeenLastCalledWith({ subject: 'Twenty minutes next month?', body: `${DRAFT.body}\nP.S. Thanks.` });
  },
};

/** A save the app refuses: its message shows, the edits stay. */
export const SaveFails: Story = {
  args: { draft: DRAFT, onSave: fn(() => Promise.reject(new Error('Could not reach the server.'))) },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await typeInto(c.getByLabelText('Subject'), '!');
    await userEvent.click(c.getByRole('button', { name: 'Save' }));
    await expect(await c.findByText('Could not reach the server.')).toBeTruthy();
    await expect(c.getByLabelText('Subject')).toHaveValue(`${DRAFT.subject}!`);
    await userEvent.click(c.getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(2));
    await expect(args.onApprove).not.toHaveBeenCalled();
    // Start over saves first; the save fails, so the draft and its edits stay.
    await userEvent.click(c.getByRole('button', { name: 'Start over from a proposal' }));
    await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(3));
    await expect(await c.findByText('Could not reach the server.')).toBeTruthy();
    await expect(c.getByLabelText('Subject')).toHaveValue(`${DRAFT.subject}!`);
    await expect(canvasElement.querySelector('[data-part="proposal"]')).toBeNull();
  },
};

/** The app echoes each save into `draft` before it resolves; typing on meanwhile keeps every letter. */
function EchoHarness(args: DraftFlowProps) {
  const [draft, setDraft] = useState<DraftWorking>(DRAFT);
  return (
    <DraftFlow
      {...args}
      draft={draft}
      onSave={async (next) => {
        await args.onSave(next);
        setDraft((d) => ({ ...d, ...next }));
        await new Promise((r) => setTimeout(r, 300));
      }}
    />
  );
}

export const EchoWhileTyping: Story = {
  render: (args) => (
    <div style={{ maxWidth: '64rem' }}>
      <EchoHarness {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    const subject = c.getByLabelText('Subject');
    await typeInto(subject, ' A');
    fireEvent.focusOut(subject);
    await waitFor(() => expect(args.onSave).toHaveBeenCalledWith({ subject: `${DRAFT.subject} A`, body: DRAFT.body }));
    // The echo lands while the save is still in flight; the next letters stay.
    await typeInto(subject, 'B');
    await expect(await c.findByText('Unsaved changes', {}, { timeout: 5000 })).toBeTruthy();
    await expect(subject).toHaveValue(`${DRAFT.subject} AB`);
  },
};

/** Stage 3: approved. Read back with copy buttons; Edit again or Mark as sent. */
export const Ready: Story = {
  args: { draft: { ...DRAFT, approved: true } },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    await expect(c.getByRole('heading', { name: "This is the email you're going to send" })).toBeTruthy();
    await expect(c.getByText(TO)).toBeTruthy();
    await userEvent.click(c.getByRole('button', { name: 'Copy Subject' }));
    await waitFor(() =>
      expect(c.queryByText('Copied') !== null || (window.getSelection()?.toString() ?? '').includes(DRAFT.subject)).toBe(true),
    );
    await userEvent.click(c.getByRole('button', { name: 'Edit again' }));
    await expect(args.onApprove).toHaveBeenCalledWith(false);
    await userEvent.click(c.getByRole('button', { name: 'Mark as sent' }));
    await expect(args.onSent).toHaveBeenCalled();
  },
};

/** Stage 4: sent. One line, the email collapsed under it. */
export const Sent: Story = {
  args: { draft: { ...DRAFT, approved: true }, sent: { at: '26 Oct, 14:05' } },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await expect(c.getByText('Sent 26 Oct, 14:05')).toBeTruthy();
    const email = canvasElement.querySelector('[data-part="email"]')!;
    await expect(email).not.toBeVisible();
    await userEvent.click(c.getByRole('button', { name: 'Show the email' }));
    await expect(email).toBeVisible();
  },
};

/** The app's side: holds the draft, saves it, approves and sends, with a short delay as a server would. */
function Walkthrough(args: DraftFlowProps) {
  const [draft, setDraft] = useState<DraftWorking | null>(null);
  const [sent, setSent] = useState<{ at: string } | null>(null);
  const later = () => new Promise<void>((r) => setTimeout(r, 150));
  return (
    <DraftFlow
      {...args}
      draft={draft}
      sent={sent}
      onUse={async (id) => {
        await args.onUse(id);
        await later();
        const p = args.proposals.find((x) => x.id === id)!;
        setDraft({ subject: p.subject, body: p.body, from: id, approved: false });
      }}
      onSave={async (next) => {
        await args.onSave(next);
        await later();
        setDraft((d) => (d ? { ...d, ...next } : d));
      }}
      onApprove={async (approved) => {
        await args.onApprove(approved);
        await later();
        setDraft((d) => (d ? { ...d, approved } : d));
      }}
      onSent={async () => {
        await args.onSent();
        await later();
        setSent({ at: 'just now' });
      }}
    />
  );
}

/** All four stages with local state: use a proposal, edit, start over and come back, approve, mark sent. */
export const Interactive: Story = {
  render: (args) => (
    <div style={{ maxWidth: '64rem' }}>
      <Walkthrough {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement);
    // The harness answers after a short timer, which a background tab stretches; wait generously.
    const wait = { timeout: 5000 };
    await userEvent.click(c.getByRole('button', { name: `Use this: ${PROPOSALS[2]!.subject}` }));
    const body = await c.findByLabelText('Body', {}, wait);
    await expect(args.onUse).toHaveBeenCalledWith('curious');
    await expect(c.getByText(`Started from ${PROPOSALS[2]!.subject}`)).toBeTruthy();

    await typeInto(body, '\nSee you soon.');
    await userEvent.click(c.getByRole('button', { name: 'Save' }));
    await c.findByText('Saved', {}, wait);

    await userEvent.click(c.getByRole('button', { name: 'Start over from a proposal' }));
    await expect(canvasElement.querySelectorAll('[data-part="proposal"]')).toHaveLength(PROPOSALS.length);
    await userEvent.click(c.getByRole('button', { name: 'Back to the draft' }));
    await expect(await c.findByLabelText('Body')).toHaveValue(`${PROPOSALS[2]!.body}\nSee you soon.`);

    await userEvent.click(c.getByRole('button', { name: 'Approve' }));
    await c.findByRole('heading', { name: "This is the email you're going to send" }, wait);
    await expect(c.getByText(TO)).toBeTruthy();

    await userEvent.click(c.getByRole('button', { name: 'Mark as sent' }));
    await expect(await c.findByText('Sent just now', {}, wait)).toBeTruthy();
    await expect(args.onSent).toHaveBeenCalledTimes(1);
  },
};
