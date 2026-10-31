<!-- SongCard: the model's tree drawn by the Svelte `Tree`, as SongCard.tsx draws it with React's. -->
<script lang="ts">
  import Tree from '../../../view/Tree.svelte';
  import { getForm } from '../../../layout/assembly/forms.svelte';
  import { SONG_CARD_FORMS } from './SongCard.forms';
  import { songCardHandlers, songCardView, type SongCardProps } from './SongCard.model';
  import '../../base.css';
  import '../live.css';
  import './SongCard.css';

  interface Props extends Omit<SongCardProps, 'className'> {
    class?: string;
  }

  let { class: className, ...props }: Props = $props();
  const form = getForm(SONG_CARD_FORMS, () => props.form);
</script>

<Tree tree={songCardView({ ...props, className }, form.current)} handlers={songCardHandlers(props)} />
