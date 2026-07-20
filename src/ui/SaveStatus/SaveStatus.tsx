import { useSceneStore } from '../../store/sceneStore';

const LABELS: Record<'saving' | 'saved' | 'error', string> = {
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
};

export function SaveStatus() {
  const saveStatus = useSceneStore((s) => s.saveStatus);

  if (saveStatus === 'idle') return null;

  return (
    <div className="flex items-center gap-2 text-sm text-ink" role="status">
      {saveStatus === 'saving' && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
      )}
      {LABELS[saveStatus]}
    </div>
  );
}
