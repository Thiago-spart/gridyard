import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, MapControls } from '@react-three/drei';
import { Board } from './Board';
import { Pieces } from './Pieces';
import { useSceneStore } from '../store/sceneStore';

export function Scene() {
  const [isDragging, setIsDragging] = useState(false);
  const clearSelection = useSceneStore((s) => s.clearSelection);

  return (
    <Canvas onPointerMissed={clearSelection}>
      <OrthographicCamera makeDefault position={[6, 20, 4.8]} zoom={40} up={[0, 0, -1]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 5]} intensity={0.5} />
      <Board />
      <Pieces onDragStateChange={setIsDragging} />
      <MapControls enabled={!isDragging} enableRotate={false} screenSpacePanning />
    </Canvas>
  );
}
