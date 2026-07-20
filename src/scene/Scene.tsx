import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrthographicCamera,
  PerspectiveCamera,
  MapControls,
  OrbitControls,
} from '@react-three/drei';
import { Board } from './Board';
import { Pieces } from './Pieces';
import { useSceneStore } from '../store/sceneStore';
import { BOARD_WIDTH, BOARD_DEPTH, CELL_SIZE_METERS } from '../lib/grid';

const widthMeters = BOARD_WIDTH * CELL_SIZE_METERS;
const depthMeters = BOARD_DEPTH * CELL_SIZE_METERS;
const boardCenter: [number, number, number] = [widthMeters / 2, 0, depthMeters / 2];
const perspectivePosition: [number, number, number] = [
  boardCenter[0] + 10,
  12,
  boardCenter[2] + 10,
];

export function Scene() {
  const [isDragging, setIsDragging] = useState(false);
  const clearSelection = useSceneStore((s) => s.clearSelection);
  const viewMode = useSceneStore((s) => s.viewMode);
  const viewResetToken = useSceneStore((s) => s.viewResetToken);

  return (
    <Canvas onPointerMissed={clearSelection}>
      {viewMode === 'top' ? (
        <>
          <OrthographicCamera makeDefault position={[6, 20, 4.8]} zoom={40} up={[0, 0, -1]} />
          <MapControls enabled={!isDragging} enableRotate={false} screenSpacePanning />
        </>
      ) : (
        <group key={viewResetToken}>
          <PerspectiveCamera makeDefault position={perspectivePosition} fov={45} />
          <OrbitControls enabled={!isDragging} target={boardCenter} />
        </group>
      )}
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} />
      <Board />
      <Pieces onDragStateChange={setIsDragging} />
    </Canvas>
  );
}
