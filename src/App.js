// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './components/pages/Home';
import About from './components/pages/about/AboutComponent';
import NavBar from './components/nav-bar/Navbar';
import Footer from './components/Footer/FooterComponent';
import CurrentTimeCard from './components/pages/presentTimeCard/ActiveTimeCard';
import CreateNewTimeCard from './components/pages/CreateNewTimecard/CreatenewTimecard'; 
import TimeCardIndex from './components/pages/TimeCardsIndex/TimeCardsIndex'; 
import TimeCardReports from './components/pages/reports/TimeCardReports';
import ReportPage from './components/pages/reports/ReportPage';

function App() {
  const [isNewTimeCardCreated, setIsNewTimeCardCreated] = useState(false);

  useEffect(() => {
    const currentTimeCard = localStorage.getItem('startDate');
    if (currentTimeCard) {
      setIsNewTimeCardCreated(true);
    } 
  }, []);

  return (
    <Router>
      <NavBar isNewTimeCardCreated={isNewTimeCardCreated} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/createNewTimeCard"
          element={<CreateNewTimeCard setIsNewTimeCardCreated={setIsNewTimeCardCreated} />}
        />
        <Route path="/currentTimeCard" element={<CurrentTimeCard setIsNewTimeCardCreated={setIsNewTimeCardCreated} />} />
        <Route path="/timeCardIndex" element={<TimeCardIndex />} />
        <Route path="/reports" element={<TimeCardReports />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
