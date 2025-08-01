import React, { useEffect, useRef } from 'react';
import { OpenWeatherTempScale } from '../../types';
import WeatherCard from './WeatherCard';

interface CarouselProps {
  cities: string[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  onRemoveCity: (index: number) => void;
  onSetDefault: (city: string) => void;
  tempScale: OpenWeatherTempScale;
  homeCity?: string;
}

const Carousel: React.FC<CarouselProps> = ({
  cities,
  currentIndex,
  setCurrentIndex,
  onRemoveCity,
  onSetDefault,
  tempScale,
  homeCity,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: currentIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const nextCard = () => {
    if (currentIndex < cities.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const scrollToCard = (index: number) => {
    setCurrentIndex(index);
  };

  if (cities.length === 0) {
    return (
      <div className="text-center py-4 animate-fade-in">
        <div className="glassmorphism rounded-2xl p-6">
          <div className="text-4xl mb-3">🌤️</div>
          <h3 className="text-base font-semibold text-white text-shadow-sm mb-2">
            No cities added yet
          </h3>
          <p className="text-white/70 text-sm">
            Use the search bar above to add your first city!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Navigation Arrows - Always visible for saved cities */}
      {cities.length > 1 && (
        <>
          <button
            onClick={prevCard}
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-20 glassmorphism p-2 rounded-full transition-all duration-300 hover:scale-110 hover:bg-white/20 ${
              currentIndex === 0
                ? 'opacity-50 pointer-events-none'
                : 'opacity-100'
            }`}
            title="Previous city"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={nextCard}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 glassmorphism p-2 rounded-full transition-all duration-300 hover:scale-110 hover:bg-white/20 ${
              currentIndex === cities.length - 1
                ? 'opacity-50 pointer-events-none'
                : 'opacity-100'
            }`}
            title="Next city"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="carousel w-full"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {cities.map((city, index) => (
          <div
            key={`${city}-${index}`}
            className="carousel-item"
            style={{ scrollSnapAlign: 'center' }}
          >
            <WeatherCard
              city={city}
              onDelete={() => onRemoveCity(index)}
              tempScale={tempScale}
              onSetDefault={() => onSetDefault(city)}
              isDefault={city === homeCity}
            />
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      {cities.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {cities.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToCard(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white shadow-lg scale-125'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              title={`Go to ${cities[index]}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
