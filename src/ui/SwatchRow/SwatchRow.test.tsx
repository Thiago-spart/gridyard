import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwatchRow } from './SwatchRow';

const SWATCHES = [
  { label: 'Terracotta', color: '#c65b4a' },
  { label: 'Sage', color: '#5f9e6f' },
];

describe('SwatchRow', () => {
  it('renders one button per swatch', () => {
    render(<SwatchRow swatches={SWATCHES} value="#c65b4a" onChange={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('highlights the swatch matching value', () => {
    render(<SwatchRow swatches={SWATCHES} value="#5f9e6f" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Sage' })).toHaveClass('border-accent');
    expect(screen.getByRole('button', { name: 'Terracotta' })).not.toHaveClass('border-accent');
  });

  it('calls onChange with the clicked swatch color', () => {
    const onChange = vi.fn();
    render(<SwatchRow swatches={SWATCHES} value="#c65b4a" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sage' }));
    expect(onChange).toHaveBeenCalledWith('#5f9e6f');
  });
});
