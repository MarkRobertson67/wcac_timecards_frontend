import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './components/pages/Home';
import About from './components/pages/about/about';

import NavBar from './components/NavBar/navbar';
import Footer from './components/Footer/Footer';

import CurrentTimeCard from './components/pages/currentTimeCard/currentTimeCard';
import CreateNewTimeCard from './components/pages/createNewTimecard/createNewTimeCard'; 
import TimeCardIndex from './components/pages/timeCardsIndex/timeCardsIndex'; 

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


