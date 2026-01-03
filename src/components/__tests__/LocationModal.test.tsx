import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationModal from '../LocationModal';

// Mock fetch
global.fetch = jest.fn();

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};
Object.defineProperty(global.navigator, 'geolocation', {
  writable: true,
  value: mockGeolocation,
});

describe('LocationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnLocationSet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders when open', () => {
    render(
      <LocationModal isOpen={true} onClose={mockOnClose} onLocationSet={mockOnLocationSet} />
    );

    expect(screen.getByText('Set Your Location')).toBeInTheDocument();
    expect(screen.getByText('Use my location')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 94043')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <LocationModal isOpen={false} onClose={mockOnClose} onLocationSet={mockOnLocationSet} />
    );

    expect(screen.queryByText('Set Your Location')).not.toBeInTheDocument();
  });

  it('closes when clicking overlay', () => {
    render(
      <LocationModal isOpen={true} onClose={mockOnClose} onLocationSet={mockOnLocationSet} />
    );

    const overlay = screen.getByText('Set Your Location').parentElement?.parentElement;
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('disables submit button when zip code is empty', () => {
    render(
      <LocationModal isOpen={true} onClose={mockOnClose} onLocationSet={mockOnLocationSet} />
    );

    const submitButton = screen.getByRole('button', { name: /set location/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when zip code is entered', () => {
    render(
      <LocationModal isOpen={true} onClose={mockOnClose} onLocationSet={mockOnLocationSet} />
    );

    const input = screen.getByPlaceholderText('e.g., 94043');
    fireEvent.change(input, { target: { value: '94043' } });

    const submitButton = screen.getByRole('button', { name: /set location/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('handles zip code submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => [{ lat: '37.4419', lon: '-122.143' }],
    });

    render(
      <LocationModal isOpen={true} onClose={mockOnClose} onLocationSet={mockOnLocationSet} />
    );

    const input = screen.getByPlaceholderText('e.g., 94043');
    fireEvent.change(input, { target: { value: '94043' } });

    const submitButton = screen.getByRole('button', { name: /set location/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnLocationSet).toHaveBeenCalledWith(37.4419, -122.143, '94043');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('handles Enter key press', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => [{ lat: '37.4419', lon: '-122.143' }],
    });

    render(
      <LocationModal isOpen={true} onClose={mockOnClose} onLocationSet={mockOnLocationSet} />
    );

    const input = screen.getByPlaceholderText('e.g., 94043');
    fireEvent.change(input, { target: { value: '94043' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockOnLocationSet).toHaveBeenCalledWith(37.4419, -122.143, '94043');
    });
  });

  it('shows loading state during geocoding', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ json: async () => [] }), 100))
    );

    render(
      <LocationModal isOpen={true} onClose={mockOnClose} onLocationSet={mockOnLocationSet} />
    );

    const input = screen.getByPlaceholderText('e.g., 94043');
    fireEvent.change(input, { target: { value: '94043' } });

    const submitButton = screen.getByRole('button', { name: /set location/i });
    fireEvent.click(submitButton);

    expect(screen.getByText('Setting...')).toBeInTheDocument();
  });
});
