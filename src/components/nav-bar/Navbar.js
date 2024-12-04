// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../Assets/WCAD_LOGO.png";
import "../nav-bar/NavBar.css";

function NavBar({ isNewTimeCardCreated }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>
          <img src={logo} alt="Logo" style={{ height: "40px" }} />
        </Link>

        <span className="navbar-title ms-2 text-white">
          We Care Adult Care Timecards
        </span>

        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div
          className={`collapse navbar-collapse ${isMenuOpen ? "show" : ""}`}
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto">
            <li
              className={`nav-item ${
                location.pathname === "/" ? "active" : ""
              }`}
            >
              <Link className="nav-link" to="/" onClick={closeMenu}>
                Home
              </Link>
            </li>
            <li
              className={`nav-item ${
                location.pathname === "/tutorials" ? "active" : ""
              }`}
            >
              <Link className="nav-link" to="/tutorials" onClick={closeMenu}>
                Tutorials
              </Link>
            </li>
            <li
              className={`nav-item ${
                location.pathname === "/createNewTimeCard" ||
                location.pathname === "/activeTimeCard"
                  ? "active"
                  : ""
              }`}
            >
              <Link
                className="nav-link"
                to={
                  isNewTimeCardCreated
                    ? "/activeTimeCard"
                    : "/createNewTimeCard"
                }
                onClick={closeMenu}
              >
                {isNewTimeCardCreated
                  ? "Active Time Card"
                  : "View / Create Time Card"}
              </Link>
            </li>
            <li
              className={`nav-item ${
                location.pathname === "/timeCardIndex" ? "active" : ""
              }`}
            >
              <Link
                className="nav-link"
                to="/timeCardIndex"
                onClick={closeMenu}
              >
                Time Card Index
              </Link>
            </li>
            <li
              className={`nav-item ${
                location.pathname === "/reports" ? "active" : ""
              }`}
            >
              <Link className="nav-link" to="/reports" onClick={closeMenu}>
                Reports
              </Link>
            </li>
            <li
              className={`nav-item ${
                location.pathname === "/employees" ? "active" : ""
              }`}
            >
              <Link className="nav-link" to="/employees" onClick={closeMenu}>
                Employees
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
