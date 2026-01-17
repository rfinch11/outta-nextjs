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
    city: 'San Francisco',
    distance: '5',
    image: 'https://example.com/image.jpg',
    start_date: '2025-06-15T14:00:00',
    organizer: 'City Parks Department',
  };

  const mockActivityListing = {
    airtable_id: 'activity456',
    title: "Children's Museum",
    type: 'Activity' as const,
    city: 'Oakland',
    distance: '10',
    image: 'https://example.com/image.jpg',
    place_type: 'Museum',
  };

  const mockCampListing = {
    airtable_id: 'camp789',
    title: 'Adventure Camp',
    type: 'Camp' as const,
    city: 'Berkeley',
    distance: '15',
    image: 'https://example.com/image.jpg',
    description: 'A fun week-long adventure camp for kids ages 8-12.',
  };

  it('renders event card with all required information', () => {
    render(<ClickableCard {...mockEventListing} />);

    expect(screen.getByText('Summer Festival')).toBeInTheDocument();
    expect(screen.getByText('City Parks Department')).toBeInTheDocument();
    expect(screen.getByText(/San Francisco/)).toBeInTheDocument();
    expect(screen.getByText('June 15')).toBeInTheDocument();
  });

  it('renders activity card with place type', () => {
    render(<ClickableCard {...mockActivityListing} />);

    expect(screen.getByText("Children's Museum")).toBeInTheDocument();
    expect(screen.getByText('Museum')).toBeInTheDocument();
    expect(screen.getByText('Oakland')).toBeInTheDocument();
  });

  it('renders camp card with description', () => {
    render(<ClickableCard {...mockCampListing} />);

    expect(screen.getByText('Adventure Camp')).toBeInTheDocument();
    expect(screen.getByText(/A fun week-long adventure camp/)).toBeInTheDocument();
    expect(screen.getByText('Berkeley')).toBeInTheDocument();
  });

  it('has correct link href to listing detail page', () => {
    render(<ClickableCard {...mockEventListing} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/listings/event123');
  });

  it('renders organizer when provided', () => {
    render(<ClickableCard {...mockEventListing} />);
    expect(screen.getByText('City Parks Department')).toBeInTheDocument();
  });

  it('does not render organizer when not provided', () => {
    render(<ClickableCard {...mockActivityListing} />);
    expect(screen.queryByText('City Parks Department')).not.toBeInTheDocument();
  });

  it('renders image with correct alt text', () => {
    render(<ClickableCard {...mockEventListing} />);

    const image = screen.getByAltText('Summer Festival');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});
