const API_URL = process.env.REACT_APP_API_URL || "";

export const searchAddress = async (query) => {
  if (!query || query.length < 3) {
      return []; // Don't search for very short queries
  }
  const NOMINATIM_URL = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  
  try {
      const response = await fetch(NOMINATIM_URL);
      if (!response.ok) {
          throw new Error('Nominatim API request failed');
      }
      return response.json();
  } catch (error) {
      console.error("Error searching address:", error);
      return [];
  }
};

export const fetchFlashHistory = async () => {
  const response = await fetch(`${API_URL}/api/flash_history`);
  if (!response.ok) {
    throw new Error("Failed to fetch flash history");
  }
  return response.json();
};

export const fetchLastFlashedInvaders = async (limit = 6) => {
  const invaders = await fetchInvaders();
  const flashedInvaders = invaders
    .filter((invader) => invader.flashed && invader.date_flash)
    .sort((a, b) => new Date(b.date_flash) - new Date(a.date_flash))
    .slice(0, limit);

  return flashedInvaders;
};

export const fetchInvaders = async () => {
  const response = await fetch(`${API_URL}/api/invaders`);
  if (!response.ok) {
    throw new Error("Failed to fetch invaders");
  }
  return response.json();
};

export const updateInvaderStatus = async (id, newAction) => {
  const response = await fetch(`${API_URL}/api/new_update_invader_status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, newAction }),
  });
  if (!response.ok) {
    throw new Error("Failed to update invader status");
  }
  return response.json();
};

export const updateInvaderComment = async (id, comment) => {
  const response = await fetch(`${API_URL}/api/update_invader_comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, comment }),
  });
  if (!response.ok) {
    throw new Error("Failed to update comment");
  }
  return response.json();
};

export const syncWithUid = async (uid) => {
  const response = await fetch(`${API_URL}/api/sync_with_uid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Sync failed");
  }
  return response.json();
};

export const fetchStats = async () => {
  const response = await fetch(`${API_URL}/get_stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  return response.json();
};

export const searchInvadersAPI = async (query) => {
  if (!query) return [];
  const response = await fetch(
    `${API_URL}/api/search_invaders?query=${encodeURIComponent(query)}`
  );
  if (!response.ok) {
    throw new Error("Search failed");
  }
  return response.json();
};

export const fetchCities = async () => {
  const response = await fetch(`${API_URL}/api/cities`);
  if (!response.ok) {
    throw new Error("Failed to fetch cities");
  }
  return response.json();
};

export const fetchInvadersByCity = async (cityCode) => {
  const response = await fetch(`${API_URL}/api/invaders/${cityCode}`);
  if (!response.ok) {
    throw new Error("Failed to fetch invaders by city");
  }
  return response.json();
};
export const fetchPnoteInvaders = async () => {
  // Utiliser un proxy CORS pour éviter les problèmes CORS
  const CORS_PROXY = 'https://corsproxy.io/?';
  const PNOTE_URL = 'https://pnote.eu/projects/invaders/map/invaders.json';
  
  try {
    const response = await fetch(CORS_PROXY + encodeURIComponent(PNOTE_URL));
    if (!response.ok) {
      throw new Error("Failed to fetch pnote invaders");
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching from pnote:', error);
    throw error;
  }
};

export const updateFromPnote = async () => {
  // Récupérer les données depuis pnote
  const pnoteInvaders = await fetchPnoteInvaders();
  
  // Envoyer au backend pour traitement
  const response = await fetch(`${API_URL}/api/update_from_pnote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invaders: pnoteInvaders }),
  });
  
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Update from pnote failed");
  }
  return response.json();
};
