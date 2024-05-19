
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

function NavBar() {
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          AddLogo
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
            <li className={`nav-item ${location.pathname === '/newtimecard' ? 'active' : ''}`}>
              <Link className="nav-link" to="/CurrentCard">
                Create New Time Card
              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/timecardindex' ? 'active' : ''}`}>
              <Link className="nav-link" to="/PastCard">
                Prior Time Cards
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
