import { useEffect } from 'react';

function FloatingImages() {
  useEffect(() => {
    const images = [
      'static/images/invaders_png/invader_1.png',
      'static/images/invaders_png/invader_christmas-min.png',
      'static/images/invaders_png/invader_3.png',
      'static/images/invaders_png/invader_4.png',
      'static/images/invaders_png/invader_7.png',
      'static/images/invaders_png/invader_6.png',
      'static/images/invaders_png/invader_5.png',
      'static/images/invaders_png/invader_8.png',
    ];
    
    const positions = [
      'top-left', 
      'bottom-left', 
      'bottom-right', 
      'top-middle-left', 
      'top-middle-right', 
      'middle-right', 
      'middle-left'
    ];
    
    const container = document.body;
    const createdImages = [];
    
    images.forEach((src, index) => {
      const img = document.createElement('img');
      img.src = src;
      img.className = `floating-image ${positions[index % positions.length]}`;
      img.style.animationDuration = `${5 + Math.random() * 7}s`;
      container.appendChild(img);
      createdImages.push(img);
    });
    
    // Nettoyer lors du démontage du composant
    return () => {
      createdImages.forEach(img => {
        if (img && img.parentNode) {
          img.parentNode.removeChild(img);
        }
      });
    };
  }, []); // Le tableau vide signifie que cet effet s'exécute une seule fois au montage

  // Ce composant ne rend rien directement, il ajoute juste des éléments au DOM
  return null;
}

export default FloatingImages;