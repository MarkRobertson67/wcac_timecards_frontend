
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './components/pages/Home';
import About from './components/pages/About/About';

import NavBar from './components/NavBar/Navbar';
import Footer from './components/Footer/Footer';



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

            </Routes>
          </div>
        </main>
        <Footer />
      </Router>
    </div>
  );
}

export default App;

