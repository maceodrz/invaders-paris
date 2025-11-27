import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/christmas.css';

function ChristmasPage() {
  
  // Logic to generate snow effect without external libraries
  useEffect(() => {
    const snowContainer = document.querySelector('.christmas-page');
    const flakes = [];
    
    // Create 30 snowflakes
    for (let i = 0; i < 40; i++) {
        const flake = document.createElement('div');
        flake.innerHTML = '❄';
        flake.className = 'snowflake';
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDelay = (Math.random() * 5) + 's, ' + (Math.random() * 3) + 's';
        flake.style.fontSize = (Math.random() * 20 + 10) + 'px';
        flake.style.opacity = Math.random();
        
        if(snowContainer) {
            snowContainer.appendChild(flake);
            flakes.push(flake);
        }
    }

    return () => {
        flakes.forEach(f => f.remove());
    };
  }, []);

  return (
    <div className="christmas-page">
      <div className="christmas-container">
        <h1>Joyeux Noël Chupa !</h1>
        <div className="christmas-message">
          <p>Ho Ho Ho ! 🎅</p>
          <p>
            Pour la plus grande chasseuse d'Invaders de Paris (et de Versailles !),<br/>
            Je te souhaite de merveilleuses fêtes de fin d'année ! 🎄✨
          </p>
          <p>
            <small><i>Psst: N'oublie pas de vérifier sous le sapin s'il n'y a pas un nouvel Invader caché...</i></small>
          </p>
        </div>
        <Link to="/" className="christmas-button">Retourner à la chasse 🎁</Link>
      </div>
      <footer style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.8rem', color: '#fff', fontStyle: 'italic', textShadow: '0 0 3px #000' }}>
        @ made by Santa Chups
      </footer>
    </div>
  );
}

export default ChristmasPage;
