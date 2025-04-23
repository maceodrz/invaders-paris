import React, { useEffect, useRef, useState } from 'react';
import Iframe from 'react-iframe'
import SearchBar from './SearchBar';
import Legend from './Legend';

function MapContainer({ currentFilter, pendingInvaders }) {
  const mapRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {

    const updateMap = async () => {
      setIsLoading(true);
      
      let endpoint;
      switch(currentFilter) {
        case 'flashable':
          endpoint = '/flashable_invaders';
          break;
        case 'unflashed':
          endpoint = '/unflashed_invaders';
          break;
        case 'flashable-unflashed':
          endpoint = '/flashable_and_unflashed_invaders';
          break;
        case 'flashed':
          endpoint = '/flashed_invaders';
          break;
        default:
          endpoint = '/map';
          break;
      }
      
      try {
        await fetch(endpoint);
        // Forcer le rechargement de l'iframe
        if (mapRef.current) {
          mapRef.current.src = '/static/flashed_invaders_map.html';
        }
      } catch (error) {
        console.error('Error updating map:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    updateMap();
  }, [currentFilter]);

  return (
    <div className="map-container">
      <SearchBar />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <div>Chargement...</div>
        </div>
      )}
      {<Iframe
        url="/static/flashed_invaders_map.html"
        width="100%"
        height="600px"
        id="map-frame"
        className="map-iframe"
        display="initial"
        position="relative"
        allowFullScreen
      />}
      <Legend />
    </div>
  );
}

export default MapContainer;