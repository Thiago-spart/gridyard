import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PieceForm } from './PieceForm';
import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ pieces: INITIAL_PIECES, selectedIds: [] });
});

describe('PieceForm add mode', () => {
  it('renders an "Add piece" trigger button, closed by default', () => {
    render(<PieceForm mode="add" />);
    expect(screen.getByRole('button', { name: 'Add piece' })).toBeInTheDocument();
    expect(screen.queryByText('Width')).not.toBeInTheDocument();
  });

  it('opens the form with default values when the trigger is clicked', () => {
    render(<PieceForm mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));
    expect(screen.getByText('Width')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Width' })).toHaveValue(1);
  });

  it('calls addPiece and closes the form on successful submit', () => {
    render(<PieceForm mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Widget' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.queryByText('Width')).not.toBeInTheDocument();
    const pieces = useSceneStore.getState().pieces;
    expect(pieces[pieces.length - 1].labelOverride).toBe('Widget');
  });

  it('shows an inline error and keeps the form open when the piece is too large', () => {
    render(<PieceForm mode="add" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add piece' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: 11 } });
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Widget' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText(/larger than the board/i)).toBeInTheDocument();
    expect(screen.getByText('Width')).toBeInTheDocument();
  });
});

describe('PieceForm edit mode', () => {
  it('renders nothing when no piece is selected', () => {
    render(<PieceForm mode="edit" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders nothing when two pieces are selected', () => {
    useSceneStore.setState({ selectedIds: ['pallet-1', 'shelf-1'] });
    render(<PieceForm mode="edit" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('pre-fills the form from the selected piece', () => {
    useSceneStore.setState({ selectedIds: ['shelf-1'] });
    render(<PieceForm mode="edit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
    expect(screen.getByRole('spinbutton', { name: 'Width' })).toHaveValue(2);
    expect(screen.getByLabelText('Name')).toHaveValue('Shelf');
  });

  it('calls updatePiece and closes the form on a successful save', () => {
    useSceneStore.setState({ selectedIds: ['crate-1'] });
    render(<PieceForm mode="edit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Crate' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByText('Width')).not.toBeInTheDocument();
    const crate = useSceneStore.getState().pieces.find((p) => p.id === 'crate-1');
    expect(crate?.labelOverride).toBe('My Crate');
  });

  it("shows a confirmation instead of closing when the new size conflicts, and repositions on Yes", () => {
    useSceneStore.setState({ selectedIds: ['pallet-1'] });
    render(<PieceForm mode="edit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: 4 } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText(/won't fit here/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(screen.queryByText('Width')).not.toBeInTheDocument();
    const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
    expect(pallet?.widthOverride).toBe(4);
    expect(pallet?.gridY).toBe(1);
  });

  it('dismisses the confirmation without calling updatePiece again when No is clicked', () => {
    useSceneStore.setState({ selectedIds: ['pallet-1'] });
    render(<PieceForm mode="edit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Width' }), { target: { value: 4 } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText(/won't fit here/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /let me adjust/i }));
    expect(screen.queryByText(/won't fit here/i)).not.toBeInTheDocument();
    expect(screen.getByText('Width')).toBeInTheDocument();
    const pallet = useSceneStore.getState().pieces.find((p) => p.id === 'pallet-1');
    expect(pallet?.widthOverride).toBeUndefined();
  });

  it('closes the form when the selection changes to a different piece while open', () => {
    useSceneStore.setState({ selectedIds: ['shelf-1'] });
    render(<PieceForm mode="edit" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit piece' }));
    expect(screen.getByText('Width')).toBeInTheDocument();

    act(() => {
      useSceneStore.setState({ selectedIds: ['crate-1'] });
    });

    expect(screen.queryByText('Width')).not.toBeInTheDocument();
    // The newly selected piece's overrides are untouched -- no stale submit happened.
    const crate = useSceneStore.getState().pieces.find((p) => p.id === 'crate-1');
    expect(crate?.labelOverride).toBeUndefined();
  });
});
