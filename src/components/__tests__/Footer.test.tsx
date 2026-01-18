import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

// Mock window.matchMedia for useMediaQuery hook
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('Footer', () => {
  it('renders the footer with all buttons', () => {
    render(<Footer />);

    // Check for company name/logo
    expect(screen.getByText(/Outta/i)).toBeInTheDocument();

    // Check for privacy button (opens drawer)
    expect(screen.getByRole('button', { name: /privacy/i })).toBeInTheDocument();

    // Check for terms button (opens drawer)
    expect(screen.getByRole('button', { name: /terms/i })).toBeInTheDocument();

    // Check for cookie button (opens drawer)
    expect(screen.getByRole('button', { name: /cookie/i })).toBeInTheDocument();

    // Check for copyright
    expect(screen.getByText(/© \d{4}/i)).toBeInTheDocument();
  });
});
