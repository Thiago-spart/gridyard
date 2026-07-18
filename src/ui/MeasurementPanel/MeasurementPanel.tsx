import { useSceneStore } from '../../store/sceneStore';
import { formatSize, formatDistance } from '../../lib/measurement';

export function MeasurementPanel() {
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const pieces = useSceneStore((s) => s.pieces);

  const selected = selectedIds
    .map((id) => pieces.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (selected.length === 0) {
    return <div className="text-sm text-ink">Select a piece to see its size.</div>;
  }
  if (selected.length === 1) {
    return <div className="text-sm text-ink">Size: {formatSize(selected[0])}</div>;
  }
  return <div className="text-sm text-ink">Distance: {formatDistance(selected[0], selected[1])}</div>;
}
