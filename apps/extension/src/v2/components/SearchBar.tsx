import React, { useState } from 'react';

interface SearchBarProps {
  onAddCity: (cityName: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onAddCity, 
  placeholder = "Enter city name..." 
}) => {
  const [cityInput, setCityInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCity = async () => {
    if (!cityInput.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onAddCity(cityInput.trim());
      setCityInput('');
    } catch (error) {
      console.error('Error adding city:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && cityInput.trim()) {
      handleAddCity();
    }
  };

  return (
    <div className="flex items-center space-x-3 mb-6 animate-slide-up">
      <div className="flex-1 relative">
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="input-glass w-full py-3 px-4 text-sm"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="spinner w-4 h-4"></div>
          </div>
        )}
      </div>
      
      <button
        onClick={handleAddCity}
        disabled={!cityInput.trim() || isLoading}
        className="btn-primary text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        {isLoading ? (
          <>
            <div className="spinner w-4 h-4"></div>
            <span>Adding...</span>
          </>
        ) : (
          <>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
            <span>Add City</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SearchBar; 