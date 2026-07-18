import { useSceneStore } from '../../store/sceneStore';

export function RotateButton() {
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const rotatePiece = useSceneStore((s) => s.rotatePiece);

  if (selectedIds.length !== 1) return null;

  return (
    <button
      type="button"
      onClick={() => rotatePiece(selectedIds[0])}
      className="cursor-pointer self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
    >
      Rotate 90°
    </button>
  );
}
