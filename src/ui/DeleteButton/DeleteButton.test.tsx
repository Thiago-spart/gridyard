import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteButton } from './DeleteButton';
import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [] });
});

describe('DeleteButton', () => {
  it('renders nothing when no piece is selected', () => {
    render(<DeleteButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when two pieces are selected', () => {
    useSceneStore.setState({ selectedIds: ['pallet-1', 'shelf-1'] });
    render(<DeleteButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('deletes the selected piece when clicked', () => {
    useSceneStore.setState({ selectedIds: ['crate-1'] });
    render(<DeleteButton />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(useSceneStore.getState().pieces.find((p) => p.id === 'crate-1')).toBeUndefined();
  });
});
