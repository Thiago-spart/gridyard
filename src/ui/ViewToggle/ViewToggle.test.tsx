import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewToggle } from './ViewToggle';
import { useSceneStore } from '../../store/sceneStore';

beforeEach(() => {
  useSceneStore.setState({ viewMode: 'top', viewResetToken: 0 });
});

describe('ViewToggle', () => {
  it('shows a button to switch to 3D view in top mode, with no reset button', () => {
    render(<ViewToggle />);
    expect(screen.getByRole('button', { name: /switch to 3d view/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reset view/i })).not.toBeInTheDocument();
  });

  it('switches to perspective mode when clicked', () => {
    render(<ViewToggle />);
    fireEvent.click(screen.getByRole('button', { name: /switch to 3d view/i }));
    expect(useSceneStore.getState().viewMode).toBe('perspective');
  });

  it('shows a switch-to-top button plus a reset view button in perspective mode', () => {
    useSceneStore.setState({ viewMode: 'perspective' });
    render(<ViewToggle />);
    expect(screen.getByRole('button', { name: /switch to top view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset view/i })).toBeInTheDocument();
  });

  it('switches back to top mode when clicked', () => {
    useSceneStore.setState({ viewMode: 'perspective' });
    render(<ViewToggle />);
    fireEvent.click(screen.getByRole('button', { name: /switch to top view/i }));
    expect(useSceneStore.getState().viewMode).toBe('top');
  });

  it('increments viewResetToken when reset view is clicked', () => {
    useSceneStore.setState({ viewMode: 'perspective' });
    render(<ViewToggle />);
    fireEvent.click(screen.getByRole('button', { name: /reset view/i }));
    expect(useSceneStore.getState().viewResetToken).toBe(1);
  });
});
