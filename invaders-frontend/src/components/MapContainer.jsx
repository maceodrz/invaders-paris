import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchBar from './SearchBar';
import Legend from './Legend';

// Correction icônes Leaflet pour React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

function MapContainerComponent({ currentFilter, pendingInvaders }) {
  const [invaders, setInvaders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef();
  const markerRefs = useRef(new Map());
  const userMarkerRef = useRef(null);


  const createCustomIcon = (color) => {
    return new L.Icon({
      iconUrl: `static/images/markers/marker-icon-${color}.png`,
      shadowUrl: `static/images/markers/marker-shadow.png`,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  };

  const getMarkerColor = (invader) => {
    if (invader.type !== "flashable") return "grey";
    if (pendingInvaders.includes(String(invader.id))) return "blue";
    return invader.status === "flashed" ? "green" : "violet";
  };

  const handleStatusUpdate = async (id, newAction) => {
    try {
      if (mapRef.current) {
        const currentCenter = mapRef.current.getCenter();
        const currentZoom = mapRef.current.getZoom();

        const res = await fetch('/api/new_update_invader_status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, newAction })
        });

        if (!res.ok) throw new Error('Failed to update invader status');

        const data = await res.json();

        if (data.status === 'success') {
          // Mette à jour l'état 'invaders' en fonction de l'action
            const updatedInvaders = invaders.map((inv) => {
            if (inv.id === id) {
              let updatedInv = { ...inv };
              if (newAction === 'flash') updatedInv.status = 'flashed';
              else if (newAction === 'unflash') updatedInv.status = 'unflashed';
              else if (newAction === 'disable') updatedInv.type = 'disabled';
              else if (newAction === 'enable') updatedInv.type = 'flashable';

              return updatedInv;
            }
            return inv;
            });

            // Mettre à jour les marqueurs sans déclencher un re-render complet
            const updatedInvader = updatedInvaders.find((inv) => inv.id === id);
            if (updatedInvader) {
              const newColor = getMarkerColor(updatedInvader);
              const marker = markerRefs.current.get(id);
              if (marker) {
              marker.setIcon(createCustomIcon(newColor));
              } else {
              console.error(`Marker not found for invader with id: ${id}`);
              }
            }

            // setTimeout(() => {
            // setInvaders(updatedInvaders);
            // }, 100); // Attendre que le flyTo soit terminé avant de rafraîchir l'état
            setTimeout(() => {
          const invader = invaders.find((inv) => inv.id === id);
          if (invader) {
            mapRef.current.flyTo([currentCenter.lat, currentCenter.lng], currentZoom);
          } else {
            console.warn(`No invader found with id: ${id}`);
          }}, 200); // Attendre que le flyTo soit terminé avant de rafraîchir l'état
        } else {
          alert('Erreur : ' + data.message);
        }
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour', err);
      alert("Erreur serveur");
    }
  };

  const handleSearchResultClick = (id) => {
    const invader = invaders.find((inv) => inv.id === id);
    if (invader && mapRef.current) {
      mapRef.current.flyTo([invader.lat, invader.lng], 15);

      const marker = markerRefs.current.get(id);
      if (marker) {
        marker.openPopup();
      } else {
        console.warn(`Aucun marqueur trouvé pour l'id: ${id}`);
      }
    }
  };

  const handleLocateUser = () => {
    if (!mapRef.current) return;
  
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        mapRef.current.flyTo([latitude, longitude], 15);
  
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          const marker = L.marker([latitude, longitude])
          marker.setIcon(
            new L.Icon({
              iconUrl: 'static/images/invaders_png/invader_2.png',
              iconSize: [65, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
          }))
            .addTo(mapRef.current)
            .bindPopup("Vous êtes ici");
          userMarkerRef.current = marker;
        }
  
        userMarkerRef.current.openPopup();
      },
      (error) => {
        alert("Impossible d'obtenir votre position.");
        console.error(error);
      }
    );
  };
  
  

  function MapComponent({ invaders }) {

    return (
      <MapContainer center={[48.8566, 2.3522]} zoom={12} style={{ height: '600px', width: '100%' }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {invaders.map((invader) => (
          <Marker
            key={invader.id}
            position={[invader.lat, invader.lng]}
            icon={createCustomIcon(getMarkerColor(invader))}
            ref={(ref) => {
              if (ref) markerRefs.current.set(invader.id, ref);
              else markerRefs.current.delete(invader.id); // Nettoyage
            }}
          >
            <Popup>
              <div>
                <h3>son p'tit nom : {invader.id}</h3>
                <p>Type : {invader.type}</p>
                <p>Status : {invader.status}</p>
                <p>Addresse : {invader.address}</p>
                {invader.type === 'flashable' && invader.status !== 'flashed' && (
                  <button onClick={() => handleStatusUpdate(invader.id, 'flash')}>Flash</button>
                )}
                {invader.status === 'flashed' && (
                  <button onClick={() => handleStatusUpdate(invader.id, 'unflash')}>Unflash</button>
                )}
                {invader.type === 'flashable' && (
                  <button onClick={() => handleStatusUpdate(invader.id, 'disable')}>Disable</button>
                )}
                {invader.type !== 'flashable' && (
                  <button onClick={() => handleStatusUpdate(invader.id, 'enable')}>Enable</button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  }

  useEffect(() => {
    const fetchInvaders = async () => {
      setIsLoading(true);

      try {
        const res = await fetch(`/api/invaders?filter=${currentFilter}`);
        const data = await res.json();
        setInvaders(data);
      } catch (error) {
        console.error('Error fetching invaders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvaders();
  }, [currentFilter]);

  return (
    <div className="map-container" style={{ position: 'relative' }}>
      <SearchBar onSearchResultClick={handleSearchResultClick} />
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '600px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          color: '#fff'
        }}>
          <div>Chargement...</div>
        </div>
      )}
      <MapComponent invaders={invaders} />
      <Legend />
      <button
        onClick={handleLocateUser}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: '#007BFF',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          zIndex: 1001,
          cursor: 'pointer',
        }}
      >
        📍 TT'
      </button>

    </div>
  );
}

export default MapContainerComponent;
