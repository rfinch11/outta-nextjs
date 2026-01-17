import { render, screen } from '@testing-library/react';
import ClickableCard from '../ClickableCard';

// Mock Next.js Image and Link components
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('next/link', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('ClickableCard', () => {
  const mockEventListing = {
    airtable_id: 'event123',
    title: 'Summer Festival',
    type: 'Event' as const,
    scout_pick: true,
    city: 'San Francisco',
    distance: '5',
    image: 'https://example.com/image.jpg',
    start_date: '2025-06-15T14:00:00',
  };

  const mockActivityListing = {
    airtable_id: 'activity456',
    title: "Children's Museum",
    type: 'Activity' as const,
    scout_pick: false,
    city: 'Oakland',
    distance: '10',
    image: 'https://example.com/image.jpg',
    place_type: 'Museum',
  };

  const mockCampListing = {
    airtable_id: 'camp789',
    title: 'Adventure Camp',
    type: 'Camp' as const,
    scout_pick: false,
    city: 'Berkeley',
    distance: '15',
    image: 'https://example.com/image.jpg',
    description: 'A fun week-long adventure camp for kids ages 8-12.',
  };

  it('renders event card with all required information', () => {
    render(<ClickableCard {...mockEventListing} />);

    expect(screen.getByText('Summer Festival')).toBeInTheDocument();
    expect(screen.getByText('Scout Pick')).toBeInTheDocument();
    expect(screen.getByText(/San Francisco/)).toBeInTheDocument();
    expect(screen.getByText(/5 mi/)).toBeInTheDocument();
  });

  it('renders activity card with place type', () => {
    render(<ClickableCard {...mockActivityListing} />);

    expect(screen.getByText("Children's Museum")).toBeInTheDocument();
    expect(screen.getByText('Museum')).toBeInTheDocument();
    expect(screen.queryByText('Scout Pick')).not.toBeInTheDocument();
  });

  it('renders camp card with description', () => {
    render(<ClickableCard {...mockCampListing} />);

    expect(screen.getByText('Adventure Camp')).toBeInTheDocument();
    expect(screen.getByText(/A fun week-long adventure camp/)).toBeInTheDocument();
  });

  it('has correct link href to listing detail page', () => {
    render(<ClickableCard {...mockEventListing} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/event123');
  });

  it('displays scout pick badge for scout pick listings', () => {
    render(<ClickableCard {...mockEventListing} />);
    expect(screen.getByText('Scout Pick')).toBeInTheDocument();
  });

  it('does not display scout pick badge for non-scout pick listings', () => {
    render(<ClickableCard {...mockActivityListing} />);
    expect(screen.queryByText('Scout Pick')).not.toBeInTheDocument();
  });

  it('renders image with correct alt text', () => {
    render(<ClickableCard {...mockEventListing} />);

    const image = screen.getByAltText('Summer Festival');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});
