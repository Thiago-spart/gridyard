import { useEffect, useState } from 'react';
import { useSceneStore, type PlacementResult } from '../../store/sceneStore';
import { PIECE_DEFS, getBaseFootprint, getPieceColor, getPieceLabel } from '../../lib/pieces';
import { SwatchRow } from '../SwatchRow';

const CURATED_SWATCHES = [
  { label: 'Terracotta', color: '#c65b4a' },
  { label: 'Sage', color: '#5f9e6f' },
  { label: 'Violet', color: '#8a6bb0' },
  { label: 'Teal', color: '#4a9a95' },
  { label: 'Mustard', color: '#d1a940' },
  { label: 'Rose', color: '#c76b93' },
];

interface PieceFormProps {
  mode: 'add' | 'edit';
}

export function PieceForm({ mode }: PieceFormProps) {
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const pieces = useSceneStore((s) => s.pieces);
  const addPiece = useSceneStore((s) => s.addPiece);
  const updatePiece = useSceneStore((s) => s.updatePiece);

  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(1);
  const [depth, setDepth] = useState(1);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(CURATED_SWATCHES[0].color);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  const piece = mode === 'edit' ? pieces.find((p) => p.id === selectedIds[0]) : undefined;

  // If the selection changes to a different piece while the edit form is open, close it
  // rather than silently submitting the previous piece's seeded values against the new
  // selection -- the user has to reopen (which re-seeds fresh) to edit the new piece.
  useEffect(() => {
    if (mode === 'edit' && isOpen) closeForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece?.id]);

  if (mode === 'edit' && (selectedIds.length !== 1 || !piece)) return null;

  function openForm() {
    if (mode === 'edit' && piece) {
      const base = getBaseFootprint(piece);
      setWidth(base.width);
      setDepth(base.depth);
      setLabel(getPieceLabel(piece));
      setColor(getPieceColor(piece));
    } else {
      setWidth(1);
      setDepth(1);
      setLabel('');
      setColor(CURATED_SWATCHES[0].color);
    }
    setError(null);
    setConflict(false);
    setIsOpen(true);
  }

  function closeForm() {
    setIsOpen(false);
    setError(null);
    setConflict(false);
  }

  function handleSubmit(reposition = false) {
    const input = { width, depth, label, color };
    const result: PlacementResult = mode === 'add' ? addPiece(input) : updatePiece(piece!.id, input, { reposition });

    if (result === 'created' || result === 'updated') {
      closeForm();
      return;
    }
    if (result === 'too-large') {
      setError('Piece is larger than the board.');
      setConflict(false);
      return;
    }
    if (result === 'no-space') {
      setError('No space available for this size anywhere on the board.');
      setConflict(false);
      return;
    }
    setError(null);
    setConflict(true);
  }

  const swatches =
    mode === 'edit' && piece
      ? [{ label: 'Default', color: PIECE_DEFS[piece.type].color }, ...CURATED_SWATCHES]
      : CURATED_SWATCHES;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openForm}
        className="cursor-pointer self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink"
      >
        {mode === 'add' ? 'Add piece' : 'Edit piece'}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-ink/10 p-3">
      <label className="flex items-center justify-between gap-2 text-sm">
        Width
        <input
          type="number"
          min={1}
          value={width}
          onChange={(e) => setWidth(Math.max(1, Number(e.target.value) || 1))}
          className="w-16 rounded border border-ink/20 px-2 py-1"
        />
      </label>
      <label className="flex items-center justify-between gap-2 text-sm">
        Depth
        <input
          type="number"
          min={1}
          value={depth}
          onChange={(e) => setDepth(Math.max(1, Number(e.target.value) || 1))}
          className="w-16 rounded border border-ink/20 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded border border-ink/20 px-2 py-1"
        />
      </label>
      <SwatchRow swatches={swatches} value={color} onChange={setColor} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {conflict ? (
        <div className="flex flex-col gap-2 text-sm">
          <p>This size won&apos;t fit here. Move it to the nearest free spot?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setConflict(false)}
              className="cursor-pointer rounded-md border border-ink/20 px-3 py-1.5 text-sm"
            >
              No, let me adjust
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={label.trim() === ''}
            onClick={() => handleSubmit(false)}
            className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === 'add' ? 'Add' : 'Save'}
          </button>
          <button
            type="button"
            onClick={closeForm}
            className="cursor-pointer rounded-md border border-ink/20 px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
