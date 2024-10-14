// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const [isMenuOpen, setMenuOpen] = useState(false); 

  // Toggle menu visibility
  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  return (
    <footer className="footer bg-primary text-white text-center text-xs fixed-bottom">
      <div className="container p-2">
        {/* Button to toggle menu visibility on small screens */}
        <button className="footer-toggler" onClick={toggleMenu} aria-expanded={isMenuOpen}>
          {isMenuOpen ? '✕' : '☰'}  
        </button>
        {/* Always render footer menu, but toggle visibility based on screen size and state */}
        <div className={`footer-menu ${isMenuOpen ? 'open' : ''}`} id="footerSections">
          <div className="row justify-content-center">
            <div className="col-sm-6 col-md-4 mb-3 mb-md-0">
              <h6 className="text-uppercase mb-3 footer-heading">Company</h6>
              <ul className="list-unstyled mb-0 footer-content">
                <li><Link to="/about" className="text-white">About</Link></li>
              </ul>
            </div>
            <div className="col-sm-6 col-md-4 mb-3 mb-md-0">
              <h6 className="text-uppercase mb-3 footer-heading">Help center</h6>
              <ul className="list-unstyled mb-0 footer-content">
                <li><Link to="#" className="text-white">FAQs</Link></li>
                <li><Link to="#" className="text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div className="col-sm-6 col-md-4 mb-3 mb-md-0">
              <h6 className="text-uppercase mb-3 footer-heading">Legal</h6>
              <ul className="list-unstyled mb-0 footer-content">
                <li><Link to="#" className="text-white">Privacy Policy</Link></li>
                <li><Link to="#" className="text-white">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center py-2 bg-secondary">
        <span>© 2024 We Care Adult Care Timecards App™. All Rights Reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;
