// VoteControl as the DOM renderer draws it: the same tree and handlers as `VoteControl.tsx` and `VoteControl.svelte`.
import { domPart } from '../../foundation/view/dom';
import { voteControlHandlers, voteControlState, voteControlView, type VoteControlModelProps } from './VoteControl.model';
import '../../primitives/Text/Text.css';
import './VoteControl.css';

export const VoteControlDom = domPart<VoteControlModelProps>({ events: ['onChange'], value: { prop: 'value', on: 'onChange' } }, (props, use) => {
  const own = use.state(voteControlState);
  return { tree: voteControlView(props, own.get()), handlers: voteControlHandlers(props, own) };
});
