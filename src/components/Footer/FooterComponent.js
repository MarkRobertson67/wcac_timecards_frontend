// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import packageJson from '../../../package.json';
import './Footer.css';

function FooterComponent() {
  // Use setMenuOpen consistently instead of setIsMenuOpen
  const [isMenuOpen, setMenuOpen] = useState(false);

  // Toggle menu visibility
  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  // Optionally, close the menu automatically when a link is clicked
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <footer className="footer custom-footer bg-primary text-white text-center fixed-bottom">
      <div className="footer-top container p-2">
        <div className="row align-items-center justify-content-center">
          {/* Footer Columns */}
          <div className={`col-md-4 footer-col ${isMenuOpen ? 'show-menu' : ''}`}>
            <h6 className="text-uppercase mb-3 footer-heading">Company</h6>
            <ul className="list-unstyled mb-0 footer-content">
              <li>
                <Link to="/tutorials" className="text-white" onClick={closeMenu}>
                  Tutorials
                </Link>
              </li>
            </ul>
          </div>
          <div className={`col-md-4 footer-col ${isMenuOpen ? 'show-menu' : ''}`}>
            <h6 className="text-uppercase mb-3 footer-heading">Help Center</h6>
            <ul className="list-unstyled mb-0 footer-content">
              <li>
                <Link to="/faq" className="text-white" onClick={closeMenu}>
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/contactus" className="text-white" onClick={closeMenu}>
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div className={`col-md-4 footer-col ${isMenuOpen ? 'show-menu' : ''}`}>
            <h6 className="text-uppercase mb-3 footer-heading">Legal</h6>
            <ul className="list-unstyled mb-0 footer-content">
              <li>
                <Link to="/privacypolicy" className="text-white" onClick={closeMenu}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/termsandconditions" className="text-white" onClick={closeMenu}>
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
          {/* Hamburger toggler (only visible on small screens) */}
          <div className="col-12 d-md-none">
            <button
              className="footer-toggler"
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>
      <div className="footer-bottom text-center py-1 bg-secondary">
        <span>© {new Date().getFullYear()} We Care Adult Care Timecards App™ by Mark Robertson.</span>
        <br />
        <span>All Rights Reserved. Version: {packageJson.version}</span>
      </div>
    </footer>
  );
}

export default FooterComponent;

