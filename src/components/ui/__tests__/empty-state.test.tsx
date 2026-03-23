import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';
import { Inbox } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="لا توجد بيانات" />);
    expect(screen.getByText('لا توجد بيانات')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="فارغ" description="أضف عنصراً للبدء" />);
    expect(screen.getByText('أضف عنصراً للبدء')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const mockFn = vi.fn();
    render(<EmptyState title="فارغ" actionLabel="إضافة" onAction={mockFn} />);
    expect(screen.getByText('إضافة')).toBeInTheDocument();
  });

  it('does not render action button when no actionLabel', () => {
    render(<EmptyState title="فارغ" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
