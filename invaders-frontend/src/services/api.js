const API_URL = process.env.REACT_APP_API_URL || "";

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
