import { useState, useMemo, useEffect } from 'react';
import { useInvaders } from '../hooks/useInvaders';
import { fetchInvadersByCity } from '../services/api';
import Header from '../components/Layout/Header';
import MapComponent from '../components/Map/MapComponent';
import FilterButtons from '../components/Invaders/FilterButtons';
import StatsDisplay from '../components/Invaders/StatsDisplay';
import ControlsContainer from '../components/Invaders/ControlsContainer';
import CitySelector from '../components/Map/CitySelector';
import FloatingImages from '../components/common/FloatingImages';
import Footer from '../components/Layout/Footer';
import Legend from '../components/Map/Legend';

function MapPage() {
  const { invaders, isLoading, error, updateLocalInvader, refetchInvaders } = useInvaders();
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentCity, setCurrentCity] = useState('PA');
  const [cityInvaders, setCityInvaders] = useState([]);
  const [cityInfo, setCityInfo] = useState(null);
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

  // Load Paris data by default on component mount
  useEffect(() => {
    const loadParisData = async () => {
      try {
        const data = await fetchInvadersByCity('PA');
        setCityInvaders(data.invaders);
        setCityInfo(data.city_info);
      } catch (err) {
        console.error('Failed to load Paris invaders:', err);
      }
    };
    loadParisData();
  }, []);

  // Charger les invaders par ville
  const handleCityChange = async (cityCode) => {
    setCurrentCity(cityCode);
    
    if (cityCode === 'all') {
      setCityInvaders([]);
      setCityInfo(null);
      return;
    }

    try {
      const data = await fetchInvadersByCity(cityCode);
      setCityInvaders(data.invaders);
      setCityInfo(data.city_info);
    } catch (err) {
      console.error('Failed to load city invaders:', err);
    }
  };

  // Décider quels invaders afficher
  const displayInvaders = currentCity === 'all' ? invaders : cityInvaders;

  const filteredInvaders = useMemo(() => {
    if (isLoading) return [];
    switch (currentFilter) {
      case 'flashable':
        return displayInvaders.filter(inv => inv.flashable);
      case 'unflashed':
        return displayInvaders.filter(inv => !inv.flashed);
      case 'flashable-unflashed':
        return displayInvaders.filter(inv => inv.flashable && !inv.flashed);
      case 'flashed':
        return displayInvaders.filter(inv => inv.flashed);
      case 'all':
      default:
        return displayInvaders;
    }
  }, [currentFilter, displayInvaders, isLoading]);

  if (error) return <div>Error loading data: {error}</div>;

  return (
    <div className="map-page">
      <Header />
      <CitySelector 
        onCitySelect={handleCityChange}
        currentCity={currentCity}
      />
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
          allInvaders={displayInvaders}
          updateLocalInvader={updateLocalInvader}
          cityInfo={cityInfo}
        />
      )}
      <Legend />
      <ControlsContainer refetchInvaders={refetchInvaders} />
      <FloatingImages />
      <Footer />
    </div>
  );
}

export default MapPage;
