import React, { useState } from 'react';
import { syncWithUid } from '../../services/api';

// The default UID for Juliette, stored on the frontend for convenience.

function ControlsContainer({ refetchInvaders }) {
  const [customUid, setCustomUid] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async (uid) => {
    setIsSyncing(true);
    setSyncMessage('');

    try {
      const result = await syncWithUid(uid);
      alert(`Synchronisation réussie! ${result.message}`);
      await refetchInvaders();
    } catch (error) {
      alert(`Sync failed: ${error.message}`);
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="controls-container">
      <h3>Mettre à jour via l'API FlashInvaders</h3>
      <div className="sync-section">
        <p className="info-text">
          Synchronisez la carte avec les invaders que vous avez déjà flashés en utilisant votre ID utilisateur de l'application.
        </p>
        
        {/* Juliette's Button */}
        <button
          className="button"
          onClick={() => handleSync()}
          disabled={isSyncing}
        >
          {isSyncing ? 'Synchronisation...' : 'Mettre à jour la carte pour Juliette la best'}
        </button>

        <hr style={{ margin: '20px 0' }} />

        {/* Custom UID Section */}
        <div className="custom-uid-section">
           <input
            type="text"
            value={customUid}
            onChange={(e) => setCustomUid(e.target.value)}
            placeholder="Entrez votre User ID ici"
            className="search-input"
            style={{ width: '300px', marginBottom: '10px' }}
          />
          <button
            className="button"
            onClick={() => handleSync(customUid)}
            disabled={isSyncing || !customUid}
          >
            {isSyncing ? 'Synchronisation...' : 'Mettre à jour avec mon ID'}
          </button>
        </div>
        {syncMessage && <p>{syncMessage}</p>}
      </div>
    </div>
  );
}

export default ControlsContainer;
