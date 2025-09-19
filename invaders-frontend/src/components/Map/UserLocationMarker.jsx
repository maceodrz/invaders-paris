import React from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const userIcon = new L.DivIcon({
  className: 'user-location-marker',
  html: '<div class="pulse"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function UserLocationMarker({ position }) {
  if (!position) return null;

  return (
    <Marker 
      position={[position.lat, position.lng]} 
      icon={userIcon} 
    />
  );
}

export default UserLocationMarker;
