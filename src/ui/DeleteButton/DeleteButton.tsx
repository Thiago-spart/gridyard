import { useSceneStore } from '../../store/sceneStore';

export function DeleteButton() {
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const deletePiece = useSceneStore((s) => s.deletePiece);

  if (selectedIds.length !== 1) return null;

  return (
    <button
      type="button"
      onClick={() => deletePiece(selectedIds[0])}
      className="cursor-pointer self-start rounded-md border border-ink/20 px-4 py-2 text-sm font-medium text-ink"
    >
      Delete piece
    </button>
  );
}
