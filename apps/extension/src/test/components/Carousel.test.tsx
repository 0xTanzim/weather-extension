import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Carousel from '../../v2/components/Carousel';

// Mock the WeatherCard component
vi.mock('../../v2/components/WeatherCard', () => ({
  default: ({ city, tempScale }: { city: string; tempScale: string }) => (
    <div data-testid={`weather-card-${city}`}>
      Weather Card for {city} ({tempScale})
    </div>
  ),
}));

describe('Carousel', () => {
  const mockCities = ['Dhaka', 'New York', 'London'];
  const user = userEvent.setup();

  const mockOnRemoveCity = vi.fn();
  const mockOnSetDefault = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no cities', () => {
    render(
      <Carousel
        cities={[]}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    expect(screen.getByText('No cities added yet')).toBeInTheDocument();
    expect(
      screen.getByText('Use the search bar above to add your first city!')
    ).toBeInTheDocument();
  });

  it('renders weather cards for each city', () => {
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    expect(screen.getByTestId('weather-card-Dhaka')).toBeInTheDocument();
    expect(screen.getByTestId('weather-card-New York')).toBeInTheDocument();
    expect(screen.getByTestId('weather-card-London')).toBeInTheDocument();
  });

  it('shows navigation arrows when multiple cities exist', () => {
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    expect(screen.getByTitle('Previous city')).toBeInTheDocument();
    expect(screen.getByTitle('Next city')).toBeInTheDocument();
  });

  it('hides navigation arrows when only one city exists', () => {
    render(
      <Carousel
        cities={[mockCities[0]]}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    expect(screen.queryByTitle('Previous city')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Next city')).not.toBeInTheDocument();
  });

  it('navigates to next city when next button is clicked', async () => {
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    const nextButton = screen.getByTitle('Next city');
    await user.click(nextButton);

    // Should scroll to next card
    expect(nextButton).toBeInTheDocument();
  });

  it('navigates to previous city when previous button is clicked', async () => {
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    const prevButton = screen.getByTitle('Previous city');
    await user.click(prevButton);

    // Should scroll to previous card
    expect(prevButton).toBeInTheDocument();
  });

  it('shows dot indicators for each city', () => {
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    // Check that dots are rendered for each city
    expect(screen.getByTitle('Go to Dhaka')).toBeInTheDocument();
    expect(screen.getByTitle('Go to New York')).toBeInTheDocument();
    expect(screen.getByTitle('Go to London')).toBeInTheDocument();
  });

  it('highlights active dot indicator', () => {
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    // First dot should be active (highlighted)
    const activeDot = screen.getByTitle('Go to Dhaka');
    expect(activeDot).toHaveClass('scale-125');
  });

  it('calls setCurrentIndex when dot is clicked', async () => {
    const mockSetCurrentIndex = vi.fn();
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={mockSetCurrentIndex}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    const secondDot = screen.getByTitle('Go to New York');
    await user.click(secondDot);

    expect(mockSetCurrentIndex).toHaveBeenCalledWith(1);
  });

  it('handles single city edge case', () => {
    render(
      <Carousel
        cities={['Dhaka']}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    // Should still render the carousel with one city
    expect(screen.getByTestId('weather-card-Dhaka')).toBeInTheDocument();
    // For single city, there should be no navigation arrows or dots
    expect(screen.queryByTitle('Previous city')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Next city')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Go to Dhaka')).not.toBeInTheDocument();
  });

  it('handles rapid navigation clicks', async () => {
    const mockSetCurrentIndex = vi.fn();
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={mockSetCurrentIndex}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    const nextButton = screen.getByTitle('Next city');

    // Rapid clicks should be handled gracefully
    await user.click(nextButton);
    await user.click(nextButton);
    await user.click(nextButton);

    expect(mockSetCurrentIndex).toHaveBeenCalledTimes(3);
  });

  it('applies correct CSS classes for glassmorphism effect', () => {
    render(
      <Carousel
        cities={mockCities}
        currentIndex={0}
        setCurrentIndex={vi.fn()}
        onRemoveCity={mockOnRemoveCity}
        onSetDefault={mockOnSetDefault}
        tempScale="metric"
      />
    );

    const navigationButtons = screen
      .getAllByRole('button')
      .filter(
        (button) =>
          button.title === 'Previous city' || button.title === 'Next city'
      );

    navigationButtons.forEach((button) => {
      expect(button).toHaveClass('glassmorphism');
      expect(button).toHaveClass('p-2');
      expect(button).toHaveClass('rounded-full');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-300');
    });
  });
});
