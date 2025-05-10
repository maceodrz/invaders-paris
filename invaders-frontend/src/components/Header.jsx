import React from 'react';

function Header() {
  const handleTitleClick = () => {
    window.location.href = "/valentine"; // Utiliser react-router-dom pour une navigation SPA
  };

  return (
    <h1 onClick={handleTitleClick}>La Carte des Invaders de Chupa</h1>
  );
}

export default Header;