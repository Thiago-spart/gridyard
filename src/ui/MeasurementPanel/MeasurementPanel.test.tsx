import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeasurementPanel } from './MeasurementPanel';
import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [], viewMode: 'top' });
});

describe('MeasurementPanel', () => {
  it('prompts for a selection when nothing is selected', () => {
    render(<MeasurementPanel />);
    expect(screen.getByText(/select a piece/i)).toBeInTheDocument();
  });

  it('shows the size of a single selected piece', () => {
    useSceneStore.setState({ selectedIds: ['pallet-1'] });
    render(<MeasurementPanel />);
    expect(screen.getByText(/1\.2m × 1\.2m/)).toBeInTheDocument();
  });

  it('shows the distance between two selected pieces', () => {
    // pallet-1 at (0,0) center (0.6,0.6); crate-1 at (6,0) center (7.8,0.6) -> 7.2m
    useSceneStore.setState({ selectedIds: ['pallet-1', 'crate-1'] });
    render(<MeasurementPanel />);
    expect(screen.getByText(/7\.2m/)).toBeInTheDocument();
  });
});
