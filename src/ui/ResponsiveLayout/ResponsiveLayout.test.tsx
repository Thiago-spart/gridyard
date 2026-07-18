import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveLayout } from './ResponsiveLayout';

describe('ResponsiveLayout', () => {
  it('renders both the scene and panel content', () => {
    render(<ResponsiveLayout scene={<div>scene-content</div>} panel={<div>panel-content</div>} />);
    expect(screen.getByText('scene-content')).toBeInTheDocument();
    expect(screen.getByText('panel-content')).toBeInTheDocument();
  });
});
