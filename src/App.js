import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './components/pages/Home';
import About from './components/pages/about/About';

import NavBar from './components/nav-bar/Navbar';
import Footer from './components/footer/Footer';

import CurrentTimeCard from './components/pages/currentTimeCard/CurrentTimeCard';
import CreateNewTimeCard from './components/pages/createNewTimecard/CreatenewTimecard'; 
import TimeCardIndex from './components/pages/timeCardsIndex/TimeCardsIndex'; 


function App() {
  const [isNewTimeCardCreated, setIsNewTimeCardCreated] = useState(false);

  return (
    <div className="App">
      <Router>
        <NavBar isNewTimeCardCreated={isNewTimeCardCreated} />
        <main>
          <div className="content-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route 
                path="/createNewTimeCard" 
                element={<CreateNewTimeCard setIsNewTimeCardCreated={setIsNewTimeCardCreated} />} 
              />
              <Route path="/currentTimeCard" element={<CurrentTimeCard />} />
              <Route path="/timeCardIndex" element={<TimeCardIndex />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </Router>
    </div>
  );
}

export default App;


