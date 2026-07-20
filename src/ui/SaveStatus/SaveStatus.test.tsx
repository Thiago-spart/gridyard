import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SaveStatus } from './SaveStatus';
import { useSceneStore, INITIAL_PIECES } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({
    pieces: INITIAL_PIECES,
    selectedIds: [],
    viewMode: 'top',
    saveStatus: 'idle',
  });
});

describe('SaveStatus', () => {
  it('renders nothing when idle', () => {
    render(<SaveStatus />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a saving label while saving', () => {
    useSceneStore.setState({ saveStatus: 'saving' });
    render(<SaveStatus />);
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('shows a saved label after a successful save', () => {
    useSceneStore.setState({ saveStatus: 'saved' });
    render(<SaveStatus />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('shows an error label when the save failed', () => {
    useSceneStore.setState({ saveStatus: 'error' });
    render(<SaveStatus />);
    expect(screen.getByText('Save failed')).toBeInTheDocument();
  });
});
