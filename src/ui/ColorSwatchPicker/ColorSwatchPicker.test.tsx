import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [] });
});

describe('ColorSwatchPicker', () => {
  it('renders nothing when no piece is selected', () => {
    render(<ColorSwatchPicker />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when two pieces are selected', () => {
    useSceneStore.setState({ selectedIds: ['pallet-1', 'shelf-1'] });
    render(<ColorSwatchPicker />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a Default swatch plus 6 color swatches when one piece is selected', () => {
    useSceneStore.setState({ selectedIds: ['crate-1'] });
    render(<ColorSwatchPicker />);
    expect(screen.getAllByRole('button')).toHaveLength(7);
    expect(screen.getByRole('button', { name: /default/i })).toBeInTheDocument();
  });

  it('sets the piece color when a swatch is clicked', () => {
    useSceneStore.setState({ selectedIds: ['crate-1'] });
    render(<ColorSwatchPicker />);
    fireEvent.click(screen.getByRole('button', { name: /sage/i }));
    const crate = useSceneStore.getState().pieces.find((p) => p.id === 'crate-1');
    expect(crate?.colorOverride).toBe('#5f9e6f');
  });

  it('clears the override when Default is clicked', () => {
    useSceneStore.setState({
      selectedIds: ['crate-1'],
      pieces: INITIAL_PIECES.map((p) =>
        p.id === 'crate-1' ? { ...p, colorOverride: '#5f9e6f' } : p,
      ),
    });
    render(<ColorSwatchPicker />);
    fireEvent.click(screen.getByRole('button', { name: /default/i }));
    const crate = useSceneStore.getState().pieces.find((p) => p.id === 'crate-1');
    expect(crate?.colorOverride).toBeUndefined();
  });
});
