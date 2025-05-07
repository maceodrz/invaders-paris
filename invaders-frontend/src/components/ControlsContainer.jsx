import React, { useRef } from 'react';

const apiUrl = process.env.REACT_APP_API_URL;

function ControlsContainer({ 
  pendingInvaders, 
  setPendingInvaders, 
  isValidating, 
  setIsValidating,
  validateInvaders 
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    if (!e.target.files.length) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      // Simuler un indicateur de chargement (à remplacer par un état et un composant de chargement)
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'loading-indicator';
      loadingIndicator.style.position = 'absolute';
      loadingIndicator.style.top = '0';
      loadingIndicator.style.left = '0';
      loadingIndicator.style.width = '100%';
      loadingIndicator.style.height = '100%';
      loadingIndicator.style.opacity = '0.6';
      loadingIndicator.style.zIndex = '1000';
      loadingIndicator.style.display = 'flex';
      loadingIndicator.style.justifyContent = 'center';
      loadingIndicator.style.alignItems = 'center';
      loadingIndicator.innerHTML = '<img src="static/images/waiting.gif" alt="Chargement..." style="max-width: 100%; max-height: 100%;">';
      document.querySelector('.map-container').appendChild(loadingIndicator);
      
      const response = await fetch(`${apiUrl}/upload_video`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      // Supprimer le message de chargement
      document.getElementById('loading-indicator').remove();
      
      if (data.error) {
        alert('Erreur: ' + data.error);
        return;
      }
      
      setPendingInvaders(data.new_flashed);
      setIsValidating(true);
      
    } catch (error) {
      alert('Erreur lors du traitement de la vidéo');
      console.error('Error:', error);
    }
    
    // Réinitialiser l'input file
    e.target.value = '';
  };

  const handleCancelValidation = () => {
    setPendingInvaders([]);
    setIsValidating(false);
  };

  return (
    <div className="controls-container">
      <div className="upload-section" style={{ display: isValidating ? 'none' : 'block' }}>
        <h3 style={{ color: '#7d197d', textAlign: 'center', fontFamily: '"Copperplate", "Arial Narrow", Arial, sans-serif', marginBottom: '10px' }}>
          <strong>Chargement de ta galerie FlashInvaders</strong>
        </h3>
        <p className="info-text">
          Pour charger ta galerie, tu vas devoir faire un screen vidéo assez lent de ta galerie FlashInvaders
          (scroller avec le doigt sans le lâcher dans l'élan). Et cut la fin pour garder uniquement la partie 
          où on voit les invaders. Le traitement peut prendre un peu de temps (environ 5min par minute de vidéo)
        </p>
        <input 
          type="file" 
          ref={fileInputRef}
          id="video-upload" 
          accept=".mp4,.mov,.avi" 
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button 
          className="button" 
          onClick={() => fileInputRef.current.click()}
        >
          Choisir une vidéo
        </button>
      </div>

      <div 
        className="validation-section"
        style={{ display: isValidating ? 'block' : 'none' }}
      >
        <h3>Validation des Invaders</h3>
        <p className="status-text">
          Nouveaux invaders détectés: <span id="new-count">{pendingInvaders.length}</span>
        </p>
        <p className="info-text">
          Les invaders en bleu sont en attente de validation. Vous pouvez cliquer sur les marqueurs 
          pour vérifier les détails avant de valider.
        </p>
        <button className="button" onClick={validateInvaders}>
          Valider les invaders
        </button>
        <button className="button cancel" onClick={handleCancelValidation}>
          Annuler
        </button>
      </div>
    </div>
  );
}

export default ControlsContainer;