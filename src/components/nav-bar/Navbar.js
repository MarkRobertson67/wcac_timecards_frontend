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

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav
      className="navbar fixed-top navbar-expand-lg navbar-dark bg-primary"
      style={{ minHeight: "50px" }}
    >
      <div
        className="container-fluid d-flex align-items-center"
        style={{ justifyContent: "space-between" }}
      >
        {/* LEFT: Logo */}
        <div style={{ minWidth: "40px" }}>
          <Link className="navbar-brand" to="/" onClick={closeMenu}>
            <img src={logo} alt="Logo" style={{ height: "35px" }} />
          </Link>
        </div>

        {/* CENTER: Title */}
        <div
          className="navbar-title"
          style={{
            flex: 1,
            whiteSpace: "nowrap",
            // fontSize: "0.85rem",
            color: "white",
          }}
        >
          We Care Adult Care Timecards
        </div>

        {/* RIGHT: Hamburger */}
        <div
          className="d-lg-none" // hides this button on large screens, shows on small
          style={{
            minWidth: "50px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={toggleMenu}
            aria-controls="navbarNav"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            style={{
              width: "40px",
              height: "40px",
              display: "flex", // Make the button a flex container
              alignItems: "center", // Vertically center items
              justifyContent: "center", // Horizontally center items
              border: "none",
              background: "none",
            }}
          >
            <span style={{ fontSize: "20px", color: "white" }}>
              {isMenuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* Collapsible menu */}
        <div
          data-testid="navbar-collapse"
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
