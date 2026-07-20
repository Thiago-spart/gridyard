import { useSceneStore } from '../../store/sceneStore';
import { PIECE_DEFS } from '../../lib/pieces';

const SWATCHES: { label: string; color: string }[] = [
  { label: 'Terracotta', color: '#c65b4a' },
  { label: 'Sage', color: '#5f9e6f' },
  { label: 'Violet', color: '#8a6bb0' },
  { label: 'Teal', color: '#4a9a95' },
  { label: 'Mustard', color: '#d1a940' },
  { label: 'Rose', color: '#c76b93' },
];

export function ColorSwatchPicker() {
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const pieces = useSceneStore((s) => s.pieces);
  const setPieceColor = useSceneStore((s) => s.setPieceColor);

  if (selectedIds.length !== 1) return null;

  const piece = pieces.find((p) => p.id === selectedIds[0]);
  if (!piece) return null;

  const isDefaultActive = piece.colorOverride == null;
  const defaultColor = PIECE_DEFS[piece.type].color;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-label="Default"
        onClick={() => setPieceColor(piece.id, null)}
        className={`h-6 w-6 cursor-pointer rounded-full border-2 ${isDefaultActive ? 'border-accent' : 'border-transparent'}`}
        style={{ backgroundColor: defaultColor }}
      />
      {SWATCHES.map((swatch) => (
        <button
          key={swatch.color}
          type="button"
          aria-label={swatch.label}
          onClick={() => setPieceColor(piece.id, swatch.color)}
          className={`h-6 w-6 cursor-pointer rounded-full border-2 ${piece.colorOverride === swatch.color ? 'border-accent' : 'border-transparent'}`}
          style={{ backgroundColor: swatch.color }}
        />
      ))}
    </div>
  );
}
