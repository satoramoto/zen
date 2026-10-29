// VoteControl's stories as plain props: VoteControl.stories.tsx draws the static ones with either
// renderer's `Tree` (the Renderer toolbar); the stateful ones wrap them in a React harness.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { VoteChoice, VoteControlModelProps, Voter } from './VoteControl.model';

/** The controls. */
export const voteControlArgTypes = {
  value: { control: 'text' },
  label: { control: 'text' },
  busy: { control: 'boolean' },
  error: { control: 'text' },
  noVoteLabel: { control: 'text' },
  goneLabel: { control: 'text' },
} as const;

/** A plain yes / maybe / no, each saying what it commits to. */
export const voteChoices: readonly VoteChoice[] = [
  { value: 'yes', label: 'Yes', meaning: 'Count me in. Plan around me.' },
  { value: 'maybe', label: 'Maybe', meaning: "I might come. Don't plan around me yet." },
  { value: 'no', label: 'No', meaning: "I can't this time." },
];

/** Five names: two chose, one hasn't yet, the viewer, and one who has left. */
export const voteVoters: readonly Voter[] = [
  { name: 'You', value: 'maybe' },
  { name: 'Ada', value: 'yes' },
  { name: 'Grace', value: 'no' },
  { name: 'Linus', value: null },
  { name: 'Margaret', value: 'yes', gone: true },
];

const base: FixtureProps<VoteControlModelProps> = { choices: voteChoices, value: 'maybe', voters: voteVoters, label: 'Are you coming?' };

export const voteControlStories = defineFixtures<VoteControlModelProps>()({
  Tally: { args: base },
  NoVoteYet: { args: { ...base, value: null, voters: voteVoters.map((voter) => (voter.name === 'You' ? { ...voter, value: null } : voter)) } },
  Busy: { args: { ...base, busy: true } },
  AppError: { args: { ...base, error: 'Voting has closed.' } },
});
