// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './components/pages/Home';
import About from './components/pages/about/About';
import NavBar from './components/nav-bar/Navbar';
import Footer from './components/footer/FooterForAll';
import CurrentTimeCard from './components/pages/currentTimeCard/ActiveTimeCard';
import CreateNewTimeCard from './components/pages/createNewTimecard/CreatenewTimecard'; 
import TimeCardIndex from './components/pages/timeCardsIndex/TimeCardsIndex'; 

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
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
