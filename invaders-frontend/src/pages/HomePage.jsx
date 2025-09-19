import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/homepage.css';

function HomePage() {
  const containerRef = useRef(null);
  const columnsRef = useRef([]);
  const resizeTimeoutRef = useRef(null);

  // Classe pour gérer chaque colonne d'invaders
  class InvaderColumn {
    constructor(leftPosition, delayed = false) {
      this.leftPosition = leftPosition;
      this.delayed = delayed;
      this.interval = null;
      this.initialize();
    }

    initialize() {
      // Commencer après un délai pour les colonnes alternées
      setTimeout(() => {
        this.spawnInvader();
        // Créer un nouvel invader toutes les 2 secondes
        this.interval = setInterval(() => this.spawnInvader(), 2000);
      }, this.delayed ? 1000 : 0);
    }

    spawnInvader() {
      
      const invader = document.createElement('div');
      invader.classList.add('invader');
      invader.style.left = `${this.leftPosition}px`;
      invader.style.transform = 'translateY(-100px)';
      if (containerRef.current) {
        containerRef.current.appendChild(invader);
      }
      // Forcer un reflow pour que la transition fonctionne
      void invader.offsetHeight; // Explicitly mark as intentional no-op

      // Démarrer l'animation
      requestAnimationFrame(() => {
        invader.style.transform = `translateY(${window.innerHeight + 100}px)`;
      });

      // Supprimer l'invader après l'animation
      setTimeout(() => {
        if (invader && invader.parentNode) {
          invader.remove();
        }
      }, 8000);
    }

    cleanup() {
      if (this.interval) {
        clearInterval(this.interval);
      }
    }
  }

  const initInvaders = () => {
    // Nettoyer les anciens invaders et colonnes
    document.querySelectorAll('.invader').forEach(inv => {
      if (inv && inv.parentNode) {
        inv.remove();
      }
    });
    
    columnsRef.current.forEach(col => col.cleanup());
    columnsRef.current = [];

    // Créer de nouvelles colonnes
    const screenWidth = window.innerWidth;
    const spacing = 200;
    const numColumns = Math.ceil(screenWidth / spacing);

    for (let i = 0; i < numColumns; i++) {
      const leftPosition = i * spacing;
      columnsRef.current.push(new InvaderColumn(leftPosition, i % 2 === 1));
    }
  };

  useEffect(() => {
    // Initialisation
    initInvaders();

    // Réajuster lors du redimensionnement de la fenêtre
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(initInvaders, 300);
    };

    window.addEventListener('resize', handleResize);

    // Nettoyage lors du démontage du composant
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      columnsRef.current.forEach(col => col.cleanup());
      document.querySelectorAll('.invader').forEach(inv => {
        if (inv && inv.parentNode) {
          inv.remove();
        }
      });
    };
  }, []);

  return (
    <div className="homepage">
      <div ref={containerRef} className="invaders-container"></div>
      <div className="container">
        <h1>Joyeuse Saint-Valentin</h1>
        <div className="message">
          Pour ma chupa la plus grande des collectionneuse, sauras-tu deviner quel est ton cadeau ?
        </div>
        <Link to="/" className="button">Accéder à la carte magique</Link>
      </div>
      <footer style={{ position: 'fixed', bottom: '10px', right: '10px', fontSize: '0.8rem', color: '#a32066', fontStyle: 'italic' }}>
        @ made by chups
      </footer>
    </div>
  );
}

export default HomePage;