import React, { useState, useRef, useEffect, useCallback } from 'react';
import { searchAddress } from '../../services/api';

function AddressSearchBar({ onAddressSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const searchContainerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback((value) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      const data = await searchAddress(value);
      setResults(data);
      setIsLoading(false);
      setShowResults(true);
    }, 500); // 500ms delay
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 2) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelectResult = (result) => {
    setQuery(result.display_name); // Fill input with selected address
    setShowResults(false);
    onAddressSelect({ lat: result.lat, lon: result.lon }); // Pass coordinates to parent
  };

  return (
    <div className="address-search-container" ref={searchContainerRef}>
      <input
        type="text"
        className="search-input"
        placeholder="Rechercher une rue, une adresse..."
        value={query}
        onChange={handleInputChange}
        onFocus={() => query && results.length > 0 && setShowResults(true)}
      />
      {showResults && (
        <div className="search-results">
          {isLoading && <div className="search-result-item">Recherche...</div>}
          {!isLoading && results.length === 0 && query.length > 2 && (
            <div className="search-result-item">Aucun résultat.</div>
          )}
          {!isLoading && results.map((result) => (
            <div
              key={result.place_id}
              className="search-result-item"
              onClick={() => handleSelectResult(result)}
            >
              {result.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressSearchBar;
