// src/components/Invaders/ControlsContainer.jsx

import React, { useState } from 'react';
// We don't need syncWithUid from api.js anymore for this specific function.
// import { syncWithUid } from '../../services/api';

const API_URL = process.env.REACT_APP_API_URL || "";
const RESTORE_INVADER_API = "https://api.space-invaders.com/flashinvaders_v3_pas_trop_predictif/api/gallery?uid=";
const JULIETTE_UID = "22CF04CD-2B32-4C6D-9B44-2BE3849268EB"; // Keep your default UID here

function ControlsContainer({ refetchInvaders }) {
  const [customUid, setCustomUid] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async (uidToSync) => {
    // If no UID is passed, use Juliette's default UID
    const targetUid = uidToSync || JULIETTE_UID;

    setIsSyncing(true);
    setSyncMessage(`1/2: Fetching data from Space Invaders API for UID: ${targetUid}...`);

    try {
      // Step 1: Frontend fetches data directly from the external API
      const externalApiResponse = await fetch(`${RESTORE_INVADER_API}${targetUid}`);

      if (!externalApiResponse.ok) {
        throw new Error(`Space Invaders API returned an error: ${externalApiResponse.statusText}`);
      }

      const invadersData = await externalApiResponse.json();

      setSyncMessage('2/2: Sending data to our backend for processing...');

      // Step 2: Frontend sends the fetched data to our backend
      const backendResponse = await fetch(`${API_URL}/api/process_synced_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invadersData: invadersData }), // Send the data in the body
      });

      if (!backendResponse.ok) {
        const err = await backendResponse.json();
        throw new Error(err.message || 'Our backend failed to process the data.');
      }
      
      const result = await backendResponse.json();
      alert(`Synchronisation réussie! ${result.message}`);
      await refetchInvaders(); // Refresh the map data

    } catch (error) {
      alert(`Sync failed: ${error.message}`);
      console.error(error);
    } finally {
      setIsSyncing(false);
      setSyncMessage('');
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
          onClick={() => handleSync()} // Pass no UID to use the default
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