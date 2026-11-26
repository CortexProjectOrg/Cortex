import { Check, CheckCircle2 } from 'lucide-react';
import { toggleLecture } from '../../lib/progress';
import { useWorkspace } from '../../lib/workspace';

export function LectureProgressButtons({ id }: { id: string }) {
  const { data, update } = useWorkspace();
  const done = data.completedLectures.includes(id);
  return (
    <button
      type="button"
      className={'button small ' + (done ? 'soft' : 'secondary')}
      aria-pressed={done}
      title={done ? 'Undo completion' : 'Mark done'}
      onClick={() => update((ws) => toggleLecture(ws, id))}
    >
      {done ? <CheckCircle2 size={16} /> : <Check size={16} />} {done ? 'Done' : 'Mark done'}
    </button>
  );
}
