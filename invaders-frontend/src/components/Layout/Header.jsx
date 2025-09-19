import React from 'react';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();

  const handleTitleClick = () => {
    navigate('/valentine');
  };

  return (
    <h1 onClick={handleTitleClick}>La Carte des Invaders de Chupa</h1>
  );
}

export default Header;