import React, { useState, useRef, useEffect } from 'react';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const searchResultsRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    // Gestionnaire de clic en dehors pour fermer les résultats
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const searchInvaders = (value) => {
    setQuery(value);
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    if (value.length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/search_invaders?query=${encodeURIComponent(value)}`);
        const data = await response.json();
        
        setResults(data);
        setShowResults(data.length > 0);
      } catch (error) {
        console.error('Error searching invaders:', error);
      }
    }, 300);
  };

  const handleResultClick = (id) => {
    // Accéder à l'iframe et cliquer sur le marqueur
    const mapFrame = document.getElementById('map-frame');
    if (mapFrame && mapFrame.contentWindow) {
      const marker = mapFrame.contentWindow.document.querySelector(`[data-invader-id="${id}"]`);
      if (marker) {
        marker.click();
      }
    }
    setShowResults(false);
  };

  return (
    <div className="search-container" ref={searchContainerRef}>
      <input 
        type="text" 
        className="search-input" 
        placeholder="Rechercher un ID (ex: 12)"
        value={query}
        onChange={(e) => searchInvaders(e.target.value)}
      />
      <div 
        ref={searchResultsRef}
        className={`search-results ${showResults ? 'visible' : ''}`}
        style={{ display: showResults ? 'block' : 'none' }}
      >
        {results.map((id) => (
          <div 
            key={id} 
            className="search-result-item"
            onClick={() => handleResultClick(id)}
          >
            Invader {id}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchBar;