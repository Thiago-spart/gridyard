import { useCallback, useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useSceneStore } from '../store/sceneStore';
import { Piece } from './Piece';
import { DragPlane } from './DragPlane';

interface PiecesProps {
  onDragStateChange: (isDragging: boolean) => void;
}

export function Pieces({ onDragStateChange }: PiecesProps) {
  const pieces = useSceneStore((s) => s.pieces);
  const movePiece = useSceneStore((s) => s.movePiece);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<{ x: number; z: number } | null>(null);

  // Stable across renders (onDragStateChange is a useState setter, itself stable) so
  // every Piece gets the same function reference -- required for Piece's React.memo to
  // actually skip re-rendering unrelated pieces while one is being dragged.
  const startDrag = useCallback(
    (id: string) => {
      setDraggingId(id);
      onDragStateChange(true);
    },
    [onDragStateChange],
  );

  function handleDragMove(event: ThreeEvent<PointerEvent>) {
    setDragPoint({ x: event.point.x, z: event.point.z });
  }

  function handleDragEnd() {
    if (draggingId && dragPoint) {
      movePiece(draggingId, dragPoint.x, dragPoint.z);
    }
    setDraggingId(null);
    setDragPoint(null);
    onDragStateChange(false);
  }

  return (
    <>
      <DragPlane active={draggingId !== null} onDragMove={handleDragMove} onDragEnd={handleDragEnd} />
      {pieces.map((piece) => (
        <Piece
          key={piece.id}
          piece={piece}
          dragPoint={piece.id === draggingId ? dragPoint : null}
          onDragStart={startDrag}
        />
      ))}
    </>
  );
}
