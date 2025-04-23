import React from 'react';

function StatsDisplay({ stats }) {
  const { totalFlashed, totalUnflashed, progress } = stats;
  
  return (
    <div className="stats-container">
      <span className="stat-item">Total Flashés: <span id="total-flashed">{totalFlashed}</span></span>
      <span className="stat-item">Reste à Flasher: <span id="total-unflashed">{totalUnflashed}</span></span>
      <span className="stat-item">Progression: <span id="progress">{progress}</span>%</span>
    </div>
  );
}

export default StatsDisplay;