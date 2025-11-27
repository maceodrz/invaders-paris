import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import StatsPage from './pages/StatsPage';
import ChristmasPage from './pages/ChristmasPage'; // Import the new page
import './styles/styles.css';
import './styles/stats.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/valentine" element={<HomePage />} />
        <Route path="/christmas" element={<ChristmasPage />} /> {/* Add the route */}
        <Route path="/stats" element={<StatsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
