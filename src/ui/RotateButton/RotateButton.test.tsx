import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RotateButton } from './RotateButton';
import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [], viewMode: 'top' });
});

describe('RotateButton', () => {
  it('renders nothing when no piece is selected', () => {
    render(<RotateButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when two pieces are selected', () => {
    useSceneStore.setState({ selectedIds: ['pallet-1', 'shelf-1'] });
    render(<RotateButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('rotates the selected piece when clicked', () => {
    useSceneStore.setState({ selectedIds: ['shelf-1'] });
    render(<RotateButton />);
    fireEvent.click(screen.getByRole('button', { name: /rotate/i }));
    const shelf = useSceneStore.getState().pieces.find((p) => p.id === 'shelf-1');
    expect(shelf?.rotation).toBe(90);
  });
});
