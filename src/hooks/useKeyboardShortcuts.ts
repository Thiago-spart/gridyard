import { useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const { selectedIds, rotatePiece, clearSelection } = useSceneStore.getState();
      if (event.key === 'r' || event.key === 'R') {
        if (selectedIds.length === 1) rotatePiece(selectedIds[0]);
      } else if (event.key === 'Escape') {
        clearSelection();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
