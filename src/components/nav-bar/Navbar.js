// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/WCAD_LOGO.png';

function NavBar({ isNewTimeCardCreated }) {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Logo" style={{ height: '40px' }} />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/about' ? 'active' : ''}`}>
              <Link className="nav-link" to="/about">
                About
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/createNewTimeCard' || location.pathname === '/currentTimeCard' ? 'active' : ''}`}>
              <Link className="nav-link" to={isNewTimeCardCreated ? '/currentTimeCard' : '/createNewTimeCard'}>
                {isNewTimeCardCreated ? 'Current Time Card' : 'Create New Time Card'}
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/timeCardIndex' ? 'active' : ''}`}>
              <Link className="nav-link" to="/timeCardIndex">
                Time Card Index
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/reports' ? 'active' : ''}`}>
              <Link className="nav-link" to="/reports">
                Reports
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
