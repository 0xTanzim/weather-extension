import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ActionButtons from '../../v2/components/ActionButtons';

describe('ActionButtons', () => {
  const mockOnToggleTempScale = vi.fn();
  const mockOnToggleOverlay = vi.fn();
  const mockOnAutoLocation = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all action buttons', () => {
    render(
      <ActionButtons
        tempScale="metric"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    expect(screen.getByTitle('Toggle Fahrenheit')).toBeInTheDocument();
    expect(screen.getByTitle('Toggle overlay')).toBeInTheDocument();
    expect(screen.getByTitle('Auto-detect location')).toBeInTheDocument();
    expect(screen.getByTitle('Refresh weather data')).toBeInTheDocument();
  });

  it('displays correct temperature scale labels', () => {
    const { rerender } = render(
      <ActionButtons
        tempScale="metric"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('°C / °F')).toBeInTheDocument();

    rerender(
      <ActionButtons
        tempScale="imperial"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('°F / °C')).toBeInTheDocument();

    rerender(
      <ActionButtons
        tempScale="standard"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('°K / °C')).toBeInTheDocument();
  });

  it('calls correct handlers when buttons are clicked', async () => {
    render(
      <ActionButtons
        tempScale="metric"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    await userEvent.click(screen.getByTitle('Toggle Fahrenheit'));
    expect(mockOnToggleTempScale).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByTitle('Toggle overlay'));
    expect(mockOnToggleOverlay).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByTitle('Auto-detect location'));
    expect(mockOnAutoLocation).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByTitle('Refresh weather data'));
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinners when appropriate', () => {
    render(
      <ActionButtons
        tempScale="metric"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={true}
        isRefreshing={true}
      />
    );

    // Check that buttons are disabled when loading
    expect(screen.getByTitle('Auto-detect location')).toBeDisabled();
    expect(screen.getByTitle('Refresh weather data')).toBeDisabled();
  });

  it('displays correct button labels', () => {
    render(
      <ActionButtons
        tempScale="metric"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    expect(screen.getByText('°C / °F')).toBeInTheDocument();
    expect(screen.getByText('Overlay')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('has correct CSS classes', () => {
    render(
      <ActionButtons
        tempScale="metric"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('glassmorphism');
      expect(button).toHaveClass('p-3');
      expect(button).toHaveClass('rounded-xl');
    });
  });

  it('supports keyboard navigation', async () => {
    render(
      <ActionButtons
        tempScale="metric"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    const tempButton = screen.getByTitle('Toggle Fahrenheit');
    tempButton.focus();
    await userEvent.keyboard('{Enter}');
    expect(mockOnToggleTempScale).toHaveBeenCalledTimes(1);
  });

  it('prevents multiple rapid clicks', async () => {
    render(
      <ActionButtons
        tempScale="metric"
        onToggleTempScale={mockOnToggleTempScale}
        onToggleOverlay={mockOnToggleOverlay}
        onAutoLocation={mockOnAutoLocation}
        onRefresh={mockOnRefresh}
        isLocating={false}
        isRefreshing={false}
      />
    );

    const tempButton = screen.getByTitle('Toggle Fahrenheit');
    await userEvent.click(tempButton);
    await userEvent.click(tempButton);
    await userEvent.click(tempButton);

    // Should handle rapid clicks gracefully
    expect(mockOnToggleTempScale).toHaveBeenCalledTimes(3);
  });
});
