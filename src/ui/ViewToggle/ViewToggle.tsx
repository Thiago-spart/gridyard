import { useSceneStore } from '../../store/sceneStore';

export function ViewToggle() {
  const viewMode = useSceneStore((s) => s.viewMode);
  const setViewMode = useSceneStore((s) => s.setViewMode);
  const resetView = useSceneStore((s) => s.resetView);

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setViewMode(viewMode === 'top' ? 'perspective' : 'top')}
        className="cursor-pointer self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
      >
        {viewMode === 'top' ? 'Switch to 3D view' : 'Switch to top view'}
      </button>
      {viewMode === 'perspective' && (
        <button
          type="button"
          onClick={resetView}
          className="cursor-pointer self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
        >
          Reset view
        </button>
      )}
    </div>
  );
}
