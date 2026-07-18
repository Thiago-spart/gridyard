import type { ThreeEvent } from '@react-three/fiber';
import { BOARD_WIDTH, BOARD_DEPTH, CELL_SIZE_METERS } from '../lib/grid';

interface DragPlaneProps {
  active: boolean;
  onDragMove: (event: ThreeEvent<PointerEvent>) => void;
  onDragEnd: () => void;
}

const PADDING_METERS = 5;
const planeWidth = BOARD_WIDTH * CELL_SIZE_METERS + PADDING_METERS * 2;
const planeDepth = BOARD_DEPTH * CELL_SIZE_METERS + PADDING_METERS * 2;

export function DragPlane({ active, onDragMove, onDragEnd }: DragPlaneProps) {
  return (
    <mesh
      position={[(BOARD_WIDTH * CELL_SIZE_METERS) / 2, 0.3, (BOARD_DEPTH * CELL_SIZE_METERS) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={active ? onDragMove : undefined}
      onPointerUp={active ? onDragEnd : undefined}
      onPointerLeave={active ? onDragEnd : undefined}
    >
      <planeGeometry args={[planeWidth, planeDepth]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
