import React, { useState, useMemo, useEffect } from 'react';
import { useInvaders } from '../hooks/useInvaders';
import Header from '../components/Layout/Header';
import MapComponent from '../components/Map/MapComponent';
import FilterButtons from '../components/Invaders/FilterButtons';
import StatsDisplay from '../components/Invaders/StatsDisplay';
import ControlsContainer from '../components/Invaders/ControlsContainer';
import FloatingImages from '../components/common/FloatingImages';
import Footer from '../components/Layout/Footer';

function MapPage() {
  const { invaders, isLoading, error, updateLocalInvader, refetchInvaders } = useInvaders(); // Get refetch function
  const [currentFilter, setCurrentFilter] = useState('all');
  const [stats, setStats] = useState({ totalFlashed: 0, progress: 0 });

  useEffect(() => {
    if (invaders.length > 0) {
      const flashedCount = invaders.filter(inv => inv.flashed).length;
      const flashableCount = invaders.filter(inv => inv.flashable).length;
      const newProgress = flashableCount > 0 ? (flashedCount / flashableCount) * 100 : 0;
      setStats({
        totalFlashed: flashedCount,
        progress: newProgress.toFixed(2),
      });
    }
  }, [invaders]);

  const filteredInvaders = useMemo(() => {
    if (isLoading) return [];
    switch (currentFilter) {
      case 'flashable':
        return invaders.filter(inv => inv.flashable);
      case 'unflashed':
        return invaders.filter(inv => !inv.flashed);
      case 'flashable-unflashed':
        return invaders.filter(inv => inv.flashable && !inv.flashed);
      case 'flashed':
        return invaders.filter(inv => inv.flashed);
      case 'all':
      default:
        return invaders;
    }
  }, [currentFilter, invaders, isLoading]);

  if (error) return <div>Error loading data: {error}</div>;

  return (
    <div className="map-page">
      <Header />
      <FilterButtons 
        currentFilter={currentFilter} 
        updateFilterButtons={setCurrentFilter}
      />
      <StatsDisplay stats={stats} />
      {isLoading ? (
        <div>Chargement de la carte...</div>
      ) : (
        <MapComponent 
          invaders={filteredInvaders}
          allInvaders={invaders}
          updateLocalInvader={updateLocalInvader}
        />
      )}
      <ControlsContainer refetchInvaders={refetchInvaders} />
      <FloatingImages />
      <Footer />
    </div>
  );
}

export default MapPage;
