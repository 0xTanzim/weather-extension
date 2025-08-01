import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import SearchBar from '../../v2/components/SearchBar';

describe('SearchBar', () => {
  const mockOnAddCity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and add button', () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    expect(
      screen.getByPlaceholderText('Enter city name...')
    ).toBeInTheDocument();
    expect(screen.getByText('Add City')).toBeInTheDocument();
  });

  it('handles empty input gracefully', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const addButton = screen.getByText('Add City');
    await userEvent.click(addButton);

    // Should not call onAddCity for empty input
    expect(mockOnAddCity).not.toHaveBeenCalled();
  });

  it('handles whitespace-only input gracefully', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByText('Add City');

    await userEvent.type(input, '   ');
    await userEvent.click(addButton);

    // Should not call onAddCity for whitespace-only input
    expect(mockOnAddCity).not.toHaveBeenCalled();
  });

  it('calls onAddCity with trimmed city name', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByText('Add City');

    await userEvent.type(input, '  Dhaka  ');
    await userEvent.click(addButton);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockOnAddCity).toHaveBeenCalledWith('Dhaka');
    });
  });

  it('handles Enter key press', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');

    await userEvent.type(input, 'Dhaka');
    await userEvent.keyboard('{Enter}');

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockOnAddCity).toHaveBeenCalledWith('Dhaka');
    });
  });

  it('shows loading state when adding city', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByText('Add City');

    await userEvent.type(input, 'Dhaka');
    await userEvent.click(addButton);

    // Should show loading state
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(screen.queryByText('Add City')).not.toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Add City')).toBeInTheDocument();
    });
  });

  it('clears input after adding city', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByText('Add City');

    await userEvent.type(input, 'Dhaka');
    await userEvent.click(addButton);

    // Wait for input to be cleared
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('disables input and button during loading', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByRole('button');

    await userEvent.type(input, 'Dhaka');
    await userEvent.click(addButton);

    // Should be disabled during loading
    expect(input).toBeDisabled();
    expect(addButton).toBeDisabled();

    // Wait for loading to complete
    await waitFor(() => {
      expect(input).not.toBeDisabled();
      expect(screen.getByText('Add City')).toBeInTheDocument();
    });
  });

  it('prevents multiple submissions while loading', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByText('Add City');

    await userEvent.type(input, 'Dhaka');
    await userEvent.click(addButton);
    await userEvent.click(addButton); // Second click should be ignored

    // Should only be called once
    await waitFor(() => {
      expect(mockOnAddCity).toHaveBeenCalledTimes(1);
    });
  });

  it('handles case sensitivity correctly', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByText('Add City');

    await userEvent.type(input, 'dhaka');
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnAddCity).toHaveBeenCalledWith('dhaka');
    });
  });

  it('handles special characters in city names', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByText('Add City');

    await userEvent.type(input, 'Saint-Jean');
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnAddCity).toHaveBeenCalledWith('Saint-Jean');
    });
  });

  it('handles very long city names', async () => {
    render(<SearchBar onAddCity={mockOnAddCity} />);

    const input = screen.getByPlaceholderText('Enter city name...');
    const addButton = screen.getByText('Add City');

    const longCityName = 'A'.repeat(100);
    await userEvent.type(input, longCityName);
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnAddCity).toHaveBeenCalledWith(longCityName);
    });
  });
});
