import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import MapPage from './components/MapPage';
import './styles/styles.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/valentine" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;