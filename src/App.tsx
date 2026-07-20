import { useEffect, useMemo } from 'react';
import { Scene } from './scene/Scene';
import { MeasurementPanel } from './ui/MeasurementPanel';
import { Legend } from './ui/Legend';
import { RotateButton } from './ui/RotateButton';
import { ResponsiveLayout } from './ui/ResponsiveLayout';
import { SaveStatus } from './ui/SaveStatus';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useSceneStore } from './store/sceneStore';
import { debounce } from './lib/debounce';

export function App() {
  useKeyboardShortcuts();
  const loadScene = useSceneStore((s) => s.loadScene);
  const saveScene = useSceneStore((s) => s.saveScene);
  const pieces = useSceneStore((s) => s.pieces);

  const debouncedSave = useMemo(() => debounce(saveScene, 600), [saveScene]);

  useEffect(() => {
    loadScene();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    debouncedSave();
  }, [pieces, debouncedSave]);

  return (
    <ResponsiveLayout
      scene={<Scene />}
      panel={
        <div className="flex flex-col gap-3">
          <SaveStatus />
          <Legend />
          <MeasurementPanel />
          <RotateButton />
        </div>
      }
    />
  );
}
