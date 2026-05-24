import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Loading from './loading';

describe('Items Loading Page', () => {
  it('renders loading skeleton', () => {
    const { container } = render(<Loading />);
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    expect(container.textContent).toContain('Items');
  });
});
