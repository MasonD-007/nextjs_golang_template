import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemsList from './ItemsList';

vi.mock('@/lib/actions');
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ItemsList', () => {
    const mockItems = [
        { id: 1, name: 'Test Item', description: 'Test Description', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    ];

    it('renders items correctly', () => {
        render(<ItemsList initialItems={mockItems} />);

        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText(/Create New Item/)).toBeInTheDocument();
    });

    it('renders empty state when no items', () => {
        render(<ItemsList initialItems={[]} />);

        expect(screen.getByText('No items yet. Create one above.')).toBeInTheDocument();
    });

    it('enters edit mode when edit button is clicked', () => {
        render(<ItemsList initialItems={mockItems} />);

        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('cancels edit mode when cancel is clicked', () => {
        render(<ItemsList initialItems={mockItems} />);

        fireEvent.click(screen.getByText('Edit'));
        fireEvent.click(screen.getByText('Cancel'));

        expect(screen.queryByText('Save')).not.toBeInTheDocument();
        expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
});
