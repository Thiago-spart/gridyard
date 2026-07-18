import { useEffect } from 'react';
import { Scene } from './scene/Scene';
import { MeasurementPanel } from './ui/MeasurementPanel';
import { Legend } from './ui/Legend';
import { RotateButton } from './ui/RotateButton';
import { ResponsiveLayout } from './ui/ResponsiveLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSceneStore } from './store/sceneStore';

export function App() {
  useKeyboardShortcuts();
  const loadScene = useSceneStore((s) => s.loadScene);
  const saveScene = useSceneStore((s) => s.saveScene);
  const pieces = useSceneStore((s) => s.pieces);

  useEffect(() => {
    loadScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveScene();
  }, [pieces, saveScene]);

  return (
    <ResponsiveLayout
      scene={<Scene />}
      panel={
        <div className="flex flex-col gap-3">
          <Legend />
          <MeasurementPanel />
          <RotateButton />
        </div>
      }
    />
  );
}
