import React, { useState, useEffect } from 'react';
import { fetchCities } from '../../services/api';
import { useId } from 'react';

function CitySelector({ onCitySelect, currentCity }) {
  const [cities, setCities] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const citySelectId = useId();
  useEffect(() => {
    const loadCities = async () => {
      try {
        const citiesData = await fetchCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCities();
  }, []);

  if (isLoading) {
    return <div className="city-selector">Chargement des villes...</div>;
  }

  return (
    <div className="city-selector-container">
      <label htmlFor={citySelectId} className="city-label">Ville : </label>
      <select
        id={citySelectId}
        className="city-select"
        value={currentCity}
        onChange={(e) => onCitySelect(e.target.value)}
      >
        <option value="all">Toutes les villes</option>
        {Object.entries(cities).map(([code, info]) => (
          <option key={code} value={code}>
            {info.country} {info.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CitySelector;
