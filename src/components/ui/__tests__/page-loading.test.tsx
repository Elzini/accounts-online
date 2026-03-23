import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PageLoading, CardSkeleton } from '@/components/ui/page-loading';

describe('PageLoading', () => {
  it('renders without crashing', () => {
    const { container } = render(<PageLoading />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders 3 stat cards', () => {
    const { container } = render(<PageLoading />);
    const cards = container.querySelectorAll('.grid > div');
    expect(cards.length).toBe(3);
  });
});

describe('CardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });
});
