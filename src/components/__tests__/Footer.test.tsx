import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('renders the footer with all links', () => {
    render(<Footer />);

    // Check for company name/logo
    expect(screen.getByText(/Outta/i)).toBeInTheDocument();

    // Check for privacy link
    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument();

    // Check for terms link
    expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument();

    // Check for copyright
    expect(screen.getByText(/© \d{4}/i)).toBeInTheDocument();
  });

  it('has correct href attributes for links', () => {
    render(<Footer />);

    const privacyLink = screen.getByRole('link', { name: /privacy/i });
    const termsLink = screen.getByRole('link', { name: /terms/i });

    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(termsLink).toHaveAttribute('href', '/terms');
  });
});
