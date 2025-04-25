import React, { useState, useRef, useEffect } from 'react';

function SearchBar({ onSearchResultClick }) {
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
        
        setResults(data); // Ici, on stocke les IDs dans results
        setShowResults(data.length > 0);
      } catch (error) {
        console.error('Error searching invaders:', error);
      }
    }, 300);
  };

  const handleResultClick = (id) => {
    onSearchResultClick(id); // Appelle la fonction pour centrer la carte
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
        {results.length > 0 ? (
          results.map((id) => (
            <div 
              key={id} 
              className="search-result-item"
              onClick={() => {
                handleResultClick(id);
                setShowResults(false); // Stop displaying the list of IDs
              }}
            >
              Invader {id} {/* Affiche l'ID dans la liste */}
            </div>
          ))
        ) : (
          <div>Aucun résultat trouvé</div> // Message lorsqu'aucun résultat n'est trouvé
        )}
      </div>
    </div>
  );
}

export default SearchBar;
