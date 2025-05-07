import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SearchBar from './SearchBar';
import Legend from './Legend';
import '../styles/popup.css';

const apiUrl = process.env.REACT_APP_API_URL;

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

  // Cleanup function to properly unmount React roots when component unmounts or filters change
  useEffect(() => {
    // Capture la valeur actuelle pour la fonction de nettoyage
    const currentMarkerRefs = markerRefs.current;
    
    return () => {
      // Clean up all React roots in popups
      currentMarkerRefs.forEach((marker) => {
        if (marker.popupRoot) {
          marker.popupRoot.unmount();
          marker.popupRoot = null;
        }
      });
    };
  }, [currentFilter]);

  const renderPopupContent = (marker, invader) => {
    // Attendre que le DOM de la popup soit disponible
    setTimeout(() => {
      const popupElement = marker.getPopup().getElement();
      if (!popupElement) return;

      // Trouver le conteneur de contenu dans la popup
      const contentContainer = popupElement.querySelector('.leaflet-popup-content');
      if (!contentContainer) return;

      // Si nous n'avons pas encore de root pour cette popup, en créer un
      if (!marker.popupRoot) {
        // Vider le contenu existant
        contentContainer.innerHTML = '';
        // Créer un div pour le contenu React
        const reactContainer = document.createElement('div');
        contentContainer.appendChild(reactContainer);
        marker.popupRoot = createRoot(reactContainer);
      }

      // Rendre le contenu React dans la popup
      marker.popupRoot.render(
        <div style={{ maxLength: '100px', wordWrap: 'break-word' }}>
          <h3 className="popup-h3">son p'tit nom : {invader.id}</h3>
          <p className="popup-paragraph">Type : {invader.type}</p>
          <p className="popup-paragraph">Status : {invader.status}</p>
          <p className="popup-paragraph">Addresse : {invader.address}</p>
          {invader.type === 'flashable' && invader.status !== 'flashed' && (
        <button className="popup-button flash" onClick={() => handleStatusUpdate(invader.id, 'flash')}>Flash</button>
          )}
          {invader.status === 'flashed' && (
          <button className="popup-button unflash" onClick={() => handleStatusUpdate(invader.id, 'unflash')}>Unflash</button>
        )}

          {invader.type === 'flashable' && (
        <button className="popup-button disable" onClick={() => handleStatusUpdate(invader.id, 'disable')}>Disable</button>
          )}
          {invader.type !== 'flashable' && (
        <button className="popup-button enable" onClick={() => handleStatusUpdate(invader.id, 'enable')}>Enable</button>
          )}
        </div>
      );
    }, 0);
  };

  const handleStatusUpdate = async (id, newAction) => {
    try {
      if (mapRef.current) {
        const currentCenter = mapRef.current.getCenter();
        const currentZoom = mapRef.current.getZoom();

        const res = await fetch(`${apiUrl}/api/new_update_invader_status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, newAction })
        });

        if (!res.ok) throw new Error('Failed to update invader status');

        const data = await res.json();

        if (data.status === 'success') {
          // Mettre à jour l'état 'invaders' en fonction de l'action
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

          // Mettre à jour l'état local
          setInvaders(updatedInvaders);

          // Mettre à jour les marqueurs sans déclencher un re-render complet
          const updatedInvader = updatedInvaders.find((inv) => inv.id === id);
          if (updatedInvader) {
            const newColor = getMarkerColor(updatedInvader);
            const marker = markerRefs.current.get(id);
            
            if (marker) {
              marker.setIcon(createCustomIcon(newColor));
              
              // Si la popup est ouverte, mettre à jour son contenu
              if (marker.isPopupOpen()) {
                renderPopupContent(marker, updatedInvader);
              }
            } else {
              console.error(`Marker not found for invader with id: ${id}`);
            }
          }

          setTimeout(() => {
            mapRef.current.flyTo([currentCenter.lat, currentCenter.lng], currentZoom);
          }, 200);
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
            .bindPopup("Wopopop, t'es là !");
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
    useEffect(() => {
      // Capture la valeur actuelle pour la fonction de nettoyage
      const currentMarkerRefs = markerRefs.current;
      
      return () => {
        // Nettoyer les roots React
        currentMarkerRefs.forEach(marker => {
          if (marker.popupRoot) {
            marker.popupRoot.unmount();
            marker.popupRoot = null;
          }
        });
      };
    }, [invaders]);

    return (
      <MapContainer center={[48.8566, 2.3522]} zoom={12} style={{ height: '100%', width: '100%' }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {invaders.map((invader) => (
          <Marker
            key={invader.id}
            position={[invader.lat, invader.lng]}
            icon={createCustomIcon(getMarkerColor(invader))}
            ref={(ref) => {
              if (ref) {
                markerRefs.current.set(invader.id, ref);
                
                // Configurer la popup avec un contenu initial simple
                ref.bindPopup(`<div>Chargement...</div>`, { 
                  minWidth: 250,
                  className: 'custom-popup'
                });
                
                // Configurer un gestionnaire pour rendre le contenu React quand la popup s'ouvre
                ref.on('popupopen', () => {
                  if (ref.getPopup()) {
                    renderPopupContent(ref, invader);
                  }
                });
                ref.on('popupclose', () => {
                  if (ref.popupRoot) {
                    ref.popupRoot.unmount();
                    ref.popupRoot = null;
                  }
                });
              } else {
                // Nettoyage quand le marqueur est supprimé
                const marker = markerRefs.current.get(invader.id);
                if (marker) {
                  if (marker.popupRoot) {
                    marker.popupRoot.unmount();
                  }
                  markerRefs.current.delete(invader.id);
                }
              }
            }}
          />
        ))}
      </MapContainer>
    );
  }

  useEffect(() => {
    const fetchInvaders = async () => {
      setIsLoading(true);

      try {
        const res = await fetch(`${apiUrl}/api/invaders?filter=${currentFilter}`);
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
      {/* <Legend /> */}
      <MapComponent invaders={invaders} />
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
        📍 Ma Position
      </button>
    </div>
  );
}

export default MapContainerComponent;