import { memo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Html, Outlines } from '@react-three/drei';
import { getFootprint, getPieceColor, getPieceLabel, type PieceInstance } from '../lib/pieces';
import { CELL_SIZE_METERS } from '../lib/grid';
import { useSceneStore } from '../store/sceneStore';

interface PieceProps {
  piece: PieceInstance;
  dragPoint: { x: number; z: number } | null;
  onDragStart: (id: string) => void;
}

export const Piece = memo(function Piece({ piece, dragPoint, onDragStart }: PieceProps) {
  const { width, depth } = getFootprint(piece);
  const selectedIds = useSceneStore((s) => s.selectedIds);
  const selectPiece = useSceneStore((s) => s.selectPiece);
  const isSelected = selectedIds.includes(piece.id);

  const restPosition: [number, number, number] = [
    (piece.gridX + width / 2) * CELL_SIZE_METERS,
    0.3,
    (piece.gridY + depth / 2) * CELL_SIZE_METERS,
  ];
  const position: [number, number, number] = dragPoint
    ? [dragPoint.x, 0.3, dragPoint.z]
    : restPosition;

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    selectPiece(piece.id);
    onDragStart(piece.id);
  }

  return (
    <group position={position} onPointerDown={handlePointerDown}>
      <mesh>
        <boxGeometry args={[width * CELL_SIZE_METERS * 0.9, 0.6, depth * CELL_SIZE_METERS * 0.9]} />
        <meshStandardMaterial color={getPieceColor(piece)} />
        {isSelected && <Outlines thickness={0.05} color="#2f6fed" />}
      </mesh>
      {isSelected && (
        <Html position={[0, 0.6, 0]} center wrapperClass="pointer-events-none">
          <div className="whitespace-nowrap rounded bg-paper-raised px-1.5 py-0.5 text-xs text-ink shadow-sm">
            {getPieceLabel(piece)}
          </div>
        </Html>
      )}
    </group>
  );
});
