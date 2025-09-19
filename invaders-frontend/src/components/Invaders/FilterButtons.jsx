import React from 'react';

function FilterButtons({ currentFilter, updateFilterButtons }) {
  const filters = [
    { id: 'all-invaders', label: 'Tous les Invaders', value: 'all' },
    { id: 'flashable-invaders', label: 'Flashables', value: 'flashable' },
    { id: 'unflashed-invaders', label: 'Non Flashés', value: 'unflashed' },
    { id: 'flashable-unflashed', label: 'Flashables & Non Flashés', value: 'flashable-unflashed' },
    { id: 'flashed', label: 'Déjà Flashés (trop forte)', value: 'flashed' }
  ];

  return (
    <div className="filter-container">
      <div className="filter-buttons">
        {filters.map(filter => (
          <button 
            key={filter.id}
            id={filter.id}
            className={`filter-button ${currentFilter === filter.value ? 'active' : ''}`}
            data-filter={filter.value}
            onClick={() => {
              if (currentFilter !== filter.value) {
                updateFilterButtons(filter.value);
              }
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FilterButtons;