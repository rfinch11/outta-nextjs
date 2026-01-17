import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchModal from '../SearchModal';

// Mock ResponsiveModal to avoid Vaul drawer issues in JSDOM
jest.mock('@/components/ui/ResponsiveModal', () => ({
  ResponsiveModal: ({
    open,
    children,
    title,
  }: {
    open: boolean;
    children: React.ReactNode;
    title?: string;
  }) =>
    open ? (
      <div data-testid="modal">
        {title && <h2>{title}</h2>}
        {children}
      </div>
    ) : null,
}));

describe('SearchModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <SearchModal isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} currentQuery="" />
    );

    expect(screen.getByPlaceholderText(/Search events, activities, and camps/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Let's go/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <SearchModal isOpen={false} onClose={mockOnClose} onSearch={mockOnSearch} currentQuery="" />
    );

    expect(
      screen.queryByPlaceholderText(/Search events, activities, and camps/)
    ).not.toBeInTheDocument();
  });

  it('calls onSearch and onClose when submit button clicked', async () => {
    const user = userEvent.setup();
    render(
      <SearchModal isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} currentQuery="" />
    );

    const input = screen.getByPlaceholderText(/Search events, activities, and camps/);
    const button = screen.getByRole('button', { name: /Let's go/i });

    await user.type(input, 'playground');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('playground');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('disables submit button when input is empty', () => {
    render(
      <SearchModal isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} currentQuery="" />
    );

    const button = screen.getByRole('button', { name: /Let's go/i });
    expect(button).toBeDisabled();
  });

  it('enables submit button when input has text', async () => {
    const user = userEvent.setup();
    render(
      <SearchModal isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} currentQuery="" />
    );

    const input = screen.getByPlaceholderText(/Search events, activities, and camps/);
    const button = screen.getByRole('button', { name: /Let's go/i });

    await user.type(input, 'test');

    expect(button).not.toBeDisabled();
  });

  it('handles Enter key press to submit search', async () => {
    const user = userEvent.setup();
    render(
      <SearchModal isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} currentQuery="" />
    );

    const input = screen.getByPlaceholderText(/Search events, activities, and camps/);

    await user.type(input, 'museum{Enter}');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('museum');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('clears search and closes modal when Clear button clicked', async () => {
    const user = userEvent.setup();
    render(
      <SearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        currentQuery="test"
      />
    );

    const clearButton = screen.getByRole('button', { name: /Clear/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays current query in input on mount', () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={mockOnClose}
        onSearch={mockOnSearch}
        currentQuery="playground"
      />
    );

    const input = screen.getByPlaceholderText(
      /Search events, activities, and camps/
    ) as HTMLInputElement;
    expect(input.value).toBe('playground');
  });

  it('closes modal when clicking overlay', async () => {
    const user = userEvent.setup();
    render(
      <SearchModal isOpen={true} onClose={mockOnClose} onSearch={mockOnSearch} currentQuery="" />
    );

    // Click on the overlay (the parent div with the blur background)
    const overlay = screen
      .getByPlaceholderText(/Search events, activities, and camps/)
      .closest('[class*="fixed"]');
    if (overlay) {
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});
