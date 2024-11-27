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
import ProtectedRoute from './ProtectedRoute.js';
import TimeCardDetails from './components/pages/TimeCardsIndex/TimeCardDetails.js';


function App() {
  const [isNewTimeCardCreated, setIsNewTimeCardCreated] = useState(false);

  useEffect(() => {
    const currentTimeCard = localStorage.getItem('startDate');
    if (currentTimeCard) {
      setIsNewTimeCardCreated(true);
    } 
  }, []);


    // Version check to ensure users get the latest version of the app
    useEffect(() => {
      const checkAppVersion = async () => {
        try {
          const response = await fetch('/manifest.json');
          const manifest = await response.json();
          const currentVersion = manifest.version;
          const savedVersion = localStorage.getItem('appVersion');
          
          if (savedVersion !== currentVersion) {
            localStorage.setItem('appVersion', currentVersion);
            window.location.reload(); // Force reload to fetch the latest version
          }
        } catch (error) {
          console.error("Error checking app version:", error);
        }
      };
  
      checkAppVersion();
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
          element={<ProtectedRoute><CreateNewTimeCard setIsNewTimeCardCreated={setIsNewTimeCardCreated} /></ProtectedRoute>}
        />

        {/* Protected Routes */}
        <Route path="/activeTimeCard" element={<ProtectedRoute><ActiveTimeCard setIsNewTimeCardCreated={setIsNewTimeCardCreated} /></ProtectedRoute>} />
        <Route path="/timeCardIndex" element={<ProtectedRoute><TimeCardIndex /></ProtectedRoute>} />
        <Route path="/timeCardDetails/:date" element={<ProtectedRoute><TimeCardDetails /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><TimeCardReports /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path="/employee/:id" element={<ProtectedRoute><EmployeeDetails /></ProtectedRoute>} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
