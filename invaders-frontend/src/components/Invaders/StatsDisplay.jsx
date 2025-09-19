import React from 'react';
import { Link } from 'react-router-dom';

function StatsDisplay({ stats }) {
  const { totalFlashed } = stats;
  
  return (
    <div className="stats-container">
      <span className="stat-item">Total Flashés: <span id="total-flashed">{totalFlashed}</span></span>
      <Link to="/stats" className="button stats-button" style={{ marginLeft: '20px', padding: '8px 15px', fontSize: '0.9em' }}>
        Voir les stats
      </Link>
    </div>
  );
}

export default StatsDisplay;
