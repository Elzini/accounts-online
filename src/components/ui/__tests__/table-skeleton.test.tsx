import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TableSkeleton } from '@/components/ui/table-skeleton';

describe('TableSkeleton', () => {
  it('renders correct number of rows', () => {
    const { container } = render(<TableSkeleton columns={3} rows={4} />);
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(4);
  });

  it('renders correct number of columns per row', () => {
    const { container } = render(<TableSkeleton columns={5} rows={2} />);
    const firstRow = container.querySelector('tbody tr');
    const cells = firstRow?.querySelectorAll('td');
    expect(cells?.length).toBe(5);
  });

  it('renders header when showHeader is true', () => {
    const { container } = render(<TableSkeleton columns={3} rows={2} showHeader={true} />);
    expect(container.querySelector('thead')).toBeTruthy();
  });

  it('hides header when showHeader is false', () => {
    const { container } = render(<TableSkeleton columns={3} rows={2} showHeader={false} />);
    expect(container.querySelector('thead')).toBeNull();
  });
});
