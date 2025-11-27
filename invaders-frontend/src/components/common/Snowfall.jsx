import { useEffect } from 'react';

function Snowfall() {
  useEffect(() => {
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    document.body.appendChild(snowContainer);

    for (let i = 0; i < 10; i++) {
        const flake = document.createElement('div');
        flake.innerHTML = '❄';
        flake.className = 'snowflake';
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDelay = (Math.random() * 5) + 's, ' + (Math.random() * 3) + 's';
        flake.style.fontSize = (Math.random() * 20 + 10) + 'px';
        flake.style.opacity = Math.random() * 0.7 + 0.3;
        
        snowContainer.appendChild(flake);
    }

    return () => {
        if (document.body.contains(snowContainer)) {
            document.body.removeChild(snowContainer);
        }
    };
  }, []);

  return null;
}

export default Snowfall;
