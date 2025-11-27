import React from 'react';
import { useNavigate } from 'react-router-dom';

function SantaClaus() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/christmas');
  };

  return (
    <div 
      onClick={handleClick}
      role="button"
      aria-label="Go to Christmas Page"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        cursor: 'pointer',
        zIndex: 2000,
        animation: 'bounce 2s infinite',
        transition: 'transform 0.2s',
      }}
      title="Ho Ho Ho !"
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <img 
        src="/static/images/invaders_png/invader_11.png"
        alt="Christmas Invader"
        style={{
            width: '60px',
            height: 'auto',
            filter: 'drop-shadow(0 0 8px #d4af37)' // Gold glow
        }}
      />
      
      {/* Little Santa Hat overlay (optional styling using emoji for simplicity over the image) */}
      <div style={{
          position: 'absolute',
          top: '-15px',
          right: '-5px',
          fontSize: '30px',
          transform: 'rotate(15deg)',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))'
      }}>
        🎅
      </div>

      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </div>
  );
}

export default SantaClaus;
