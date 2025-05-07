import React, { useState, useEffect } from 'react';
import Header from './Header';
import MapContainer from './MapContainer';
import FilterButtons from './FilterButtons';
import StatsDisplay from './StatsDisplay';
import ControlsContainer from './ControlsContainer';
import FloatingImages from './FloatingImages';
import Footer from './Footer';
import Legend from './Legend';

const apiUrl = process.env.REACT_APP_API_URL;

function MapPage() {
  const [currentFilter, setCurrentFilter] = useState('all');
  const [stats, setStats] = useState({
    totalFlashed: 0,
    totalUnflashed: 0,
    progress: 0
  });
  const [pendingInvaders, setPendingInvaders] = useState([]);
  const [isValidating, setIsValidating] = useState(false);

  const updateMapView = (filter) => {
    if (filter !== currentFilter) {
      console.log('Selected filter:', currentFilter);
      setCurrentFilter(filter);
    }
    // Les appels fetch seront gérés dans le composant MapContainer
  };

  const resetFilters = () => {
    console.log('Selected filter:', currentFilter);
    setCurrentFilter('all');
  };

  const handleValidateInvaders = async () => {
    try {
      const response = await fetch(`${apiUrl}/validate_flashed_invaders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invader_ids: pendingInvaders
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        alert('Validation réussie');
        setPendingInvaders([]);
        setIsValidating(false);
        resetFilters();
      }
    } catch (error) {
      alert('Erreur lors de la validation');
      console.error('Error:', error);
    }
  };

  // Récupérer les statistiques depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${apiUrl}/get_stats`);
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalFlashed: data.total_flashed || 0,
            totalUnflashed: data.total_unflashed || 0,
            progress: data.progress || 0
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      }
    };

    fetchStats();
  }, [pendingInvaders]);

  return (
    <div className="map-page">
      {console.log("API URL:", process.env.REACT_APP_API_URL)}
      <Header />
      <FilterButtons 
        currentFilter={currentFilter} 
        updateFilterButtons={updateMapView}
      />
      <StatsDisplay stats={stats} />
      <MapContainer 
        currentFilter={currentFilter}
        pendingInvaders={pendingInvaders}
      />
      <Legend />
      {/* {<ControlsContainer 
        pendingInvaders={pendingInvaders}
        setPendingInvaders={setPendingInvaders}
        isValidating={isValidating}
        setIsValidating={setIsValidating}
        validateInvaders={handleValidateInvaders}
      />} */}
      <FloatingImages />
      <Footer />
    </div>
  );
}

export default MapPage;