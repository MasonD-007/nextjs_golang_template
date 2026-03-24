import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ItemSkeleton from './ItemSkeleton';

describe('ItemSkeleton', () => {
  it('renders skeleton loader', () => {
    const { container } = render(<ItemSkeleton />);
    
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
