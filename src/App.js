// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './components/pages/Home';
import Tutorials from './components/pages/tutorials/Tutorials.js';
import NavBar from './components/nav-bar/Navbar';
import Footer from './components/Footer/FooterComponent';
import ActiveTimeCard from './components/pages/presentTimeCard/ActiveTimeCard';
import CreateNewTimeCard from './components/pages/CreateNewTimecard/CreateNewTimecard.js'; 
import TimeCardIndex from './components/pages/TimeCardsIndex/TimeCardsIndex'; 
import TimeCardReports from './components/pages/reports/TimeCardReports';
import ReportPage from './components/pages/reports/ReportPage';
import Employees from './components/pages/Employees/Employees.js'
import EmployeeDetails from './components/pages/Employees/EmployeeDetails.js';
import ProtectedRoute from './components/ProtectedRoute'; 


function App() {
  const [isNewTimeCardCreated, setIsNewTimeCardCreated] = useState(false);

  useEffect(() => {
    const currentTimeCard = localStorage.getItem('startDate');
    if (currentTimeCard) {
      setIsNewTimeCardCreated(true);
    } 
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <NavBar isNewTimeCardCreated={isNewTimeCardCreated} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tutorials" element={<Tutorials />} />

        <Route
          path="/createNewTimeCard"
          element={<CreateNewTimeCard setIsNewTimeCardCreated={setIsNewTimeCardCreated} />}
        />

        {/* Protected Routes */}
        <Route path="/activeTimeCard" element={<ActiveTimeCard setIsNewTimeCardCreated={setIsNewTimeCardCreated} />} />
        <Route path="/timeCardIndex" element={<ProtectedRoute><TimeCardIndex /></ProtectedRoute>} />
        <Route path="/reports" element={<TimeCardReports />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/employee/:id" element={<EmployeeDetails />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
