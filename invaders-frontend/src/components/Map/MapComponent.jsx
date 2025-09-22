import React, { useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/popup.css';
import { useGeolocation } from '../../hooks/useGeolocation';
import { updateInvaderStatus } from '../../services/api';

import SearchBar from './SearchBar';
import AddressSearchBar from './AddressSearchBar';
import Legend from './Legend';
import UserLocationMarker from './UserLocationMarker';
import PopupContent from './PopupContent';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});
const createCustomIcon = (color) => new L.Icon({
  iconUrl: `/static/images/markers/marker-icon-${color}.png`,
  shadowUrl: `/static/images/markers/marker-shadow.png`,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const getMarkerColor = (invader) => {
  if (!invader.flashable) return "grey";
  return invader.flashed ? "green" : "violet";
};


function MapComponent({ invaders, allInvaders, updateLocalInvader }) {
  const mapRef = useRef(null);
  const markerRefs = useRef(new Map());
  const popupRoots = useRef(new Map());
  const { position, isTracking, startTracking, stopTracking } = useGeolocation();
  const initialZoomDoneRef = useRef(false);

  useEffect(() => {
    if (isTracking && position && mapRef.current && !initialZoomDoneRef.current) {
      mapRef.current.flyTo([position.lat, position.lng], 16);
      initialZoomDoneRef.current = true;
    }
  }, [position, isTracking]);

  const handleAddressSelect = (coords) => {
    if (mapRef.current) {
      mapRef.current.flyTo([coords.lat, coords.lon], 17);
    }
  };

  const handleStatusUpdate = async (id, newAction) => {
    try {
      const response = await updateInvaderStatus(id, newAction);
      if (response.status === 'success') {
        updateLocalInvader(response.invader);
        const marker = markerRefs.current.get(id);
        if (marker && marker.isPopupOpen()) {
            marker.closePopup();
            marker.openPopup();
        }
      } else {
        alert(`Error: ${response.message}`);
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert('Server error during update.');
    }
  };

  const handleSearchResultClick = (id) => {
    const invader = allInvaders.find((inv) => inv.id === id);
    if (invader && mapRef.current) {
      mapRef.current.flyTo([invader.lat, invader.lng], 16);
      const marker = markerRefs.current.get(id);
      if (marker) {
        setTimeout(() => marker.openPopup(), 300);
      }
    }
  };
  
  const handleToggleTracking = () => {
    if (isTracking) {
        stopTracking();
        initialZoomDoneRef.current = false;
    } else {
        startTracking();
    }
  };

  const renderPopup = (ref, invader) => {
    if (ref) {
      ref.bindPopup('', { className: 'custom-popup', minWidth: 200 });
      ref.on('popupopen', () => {
        const popupElement = ref.getPopup().getElement();
        if (!popupElement) return;
        const container = popupElement.querySelector('.leaflet-popup-content');
        if (!container) return;

        let root = popupRoots.current.get(invader.id);
        if (!root) {
            root = createRoot(container);
            popupRoots.current.set(invader.id, root);
        }
        root.render(
            <PopupContent 
                invader={invader} 
                onStatusUpdate={handleStatusUpdate}
                onCommentUpdate={updateLocalInvader}
            />
        );
      });
      ref.on('popupclose', () => {
        const root = popupRoots.current.get(invader.id);
        if (root) {
            root.unmount();
            popupRoots.current.delete(invader.id);
        }
      });
    }
  };

  return (
    <div className="map-container">
      <SearchBar onSearchResultClick={handleSearchResultClick} />
      <AddressSearchBar onAddressSelect={handleAddressSelect} />
      <MapContainer center={[48.8566, 2.3522]} zoom={12} style={{ height: '100%', width: '100%' }} ref={mapRef}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
        {invaders.map((invader) => (
          <Marker
            key={invader.id}
            position={[invader.lat, invader.lng]}
            icon={createCustomIcon(getMarkerColor(invader))}
            ref={(ref) => {
              if (ref) {
                markerRefs.current.set(invader.id, ref);
                renderPopup(ref, invader);
              } else {
                markerRefs.current.delete(invader.id);
              }
            }}
          />
        ))}
        {isTracking && position && <UserLocationMarker position={position} />}
      </MapContainer>
      <button onClick={handleToggleTracking} className="button" style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1001 }}>
        {isTracking ? '🛑' : '📍 Moi'}
      </button>
    </div>
  );
}

export default MapComponent;
