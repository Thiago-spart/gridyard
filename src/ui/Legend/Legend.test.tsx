import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Legend } from './Legend';

describe('Legend', () => {
  it('lists every piece type by label', () => {
    render(<Legend />);
    expect(screen.getByText('Pallet')).toBeInTheDocument();
    expect(screen.getByText('Shelf')).toBeInTheDocument();
    expect(screen.getByText('Crate')).toBeInTheDocument();
    expect(screen.getByText('Workstation')).toBeInTheDocument();
  });
});
