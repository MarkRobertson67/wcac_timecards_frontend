
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './navBar.css';
import logo from '../../Assets/WCAD_LOGO.png';

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
            <li className={`nav-item ${location.pathname === '/CreateNewtimecard' || location.pathname === '/CurrentTimeCard' ? 'active' : ''}`}>
              <Link className="nav-link" to={isNewTimeCardCreated ? '/CurrentTimeCard' : '/CreateNewtimecard'}>
                {isNewTimeCardCreated ? 'Current Time Card' : 'Create New Time Card'}

              </Link>
            </li>
            <li className={`nav-item ${location.pathname === '/TimeCardIndex' ? 'active' : ''}`}>
              <Link className="nav-link" to="/TimeCardIndex">
                Time Card Index
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;

