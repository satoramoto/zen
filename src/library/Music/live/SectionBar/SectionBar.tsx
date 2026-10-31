import { useForm } from '../../../layout/assembly';
import { Tree } from '../../../view/Tree';
import { SECTION_BAR_FORMS } from './SectionBar.forms';
import { sectionBarHandlers, sectionBarView, type SectionBarProps } from './SectionBar.model';
import '../../base.css';
import '../live.css';
import './SectionBar.css';

export { lengthText, type LiveSection, type SectionBarProps } from './SectionBar.model';
export { SECTION_BAR_FORMS, type SectionBarForm } from './SectionBar.forms';

/**
 * A song's sections in mix[flow]'s face: PushTwin's row-7 cell as the song's form. The section
 * playing is lit in the accent, the one the host queued blinks, the rest read ready; an unavailable
 * section is drawn but can't be pressed, and says why. It holds no state: a press asks
 * `onSection(id)`, and when the change lands is the host's (its `hint` says so). Without
 * `onSection` the bar is read-only. Forms (`SECTION_BAR_FORMS`): `bars` each cell as wide as its
 * bars, with its length; `row` equal cells, names alone; `chip` one status line.
 */
export function SectionBar(props: SectionBarProps) {
  const form = useForm(SECTION_BAR_FORMS, props.form);
  return <Tree tree={sectionBarView(props, form)} handlers={sectionBarHandlers(props)} />;
}

SectionBar.forms = SECTION_BAR_FORMS;

export default SectionBar;
