// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  // Function to toggle visibility of content
  const toggleContentVisibility = (event) => {
    const content = event.target.nextElementSibling;
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
  };

  return (
    <footer className="footer bg-primary text-white text-center text-xs fixed-bottom">
      <div className="container p-2">
        <div className="row justify-content-center">
          <div className="col-sm-6 col-md-4 mb-3 mb-md-0"> 
            <h6 className="text-uppercase mb-3 footer-heading" onMouseEnter={toggleContentVisibility}>Company</h6>
            <ul className="list-unstyled mb-0 footer-content">
              <li>
                <Link to="/about" className="text-white">About</Link>
              </li>
            </ul>
          </div>
          <div className="col-sm-6 col-md-4 mb-3 mb-md-0"> 
            <h6 className="text-uppercase mb-3 footer-heading" onMouseEnter={toggleContentVisibility}>Help center</h6>
            <ul className="list-unstyled mb-0 footer-content">
              <li>
                <Link to="#" className="text-white">FAQs</Link>
              </li>
              <li>
                <Link to="#" className="text-white">Contact Us</Link>
              </li>
            </ul>
          </div>
          <div className="col-sm-6 col-md-4 mb-3 mb-md-0"> 
            <h6 className="text-uppercase mb-3 footer-heading" onMouseEnter={toggleContentVisibility}>Legal</h6>
            <ul className="list-unstyled mb-0 footer-content">
              <li>
                <Link to="#" className="text-white">Privacy Policy</Link>
              </li>
              <li>
                <Link to="#" className="text-white">Terms &amp; Conditions</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="text-center py-2 bg-secondary">
        <span className="text-white">© 2024 <Link to="https://.netlify.app" className="text-white">We Care Adult Care Timecards App™</Link>. All Rights Reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;


