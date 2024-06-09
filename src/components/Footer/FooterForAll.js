
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';


function Footer() {
  return (
    <footer className="bg-primary text-white text-center text-lg-start fixed-bottom">
      <div className="container p-4">
        <div className="row">
          <div className="col-lg-4 mb-4 mb-md-0 text-center"> 
            <div className="bg-secondary d-inline-block p-2 rounded">
              <h6 className="text-uppercase mb-0">Company</h6>
            </div>
            <ul className="list-unstyled mb-0 text-center">
              <li>
                <Link to="/about" className="text-white">About</Link>
              </li>
            </ul>
          </div>
          <div className="col-lg-4 mb-4 mb-md-0 text-center"> 
            <div className="bg-secondary d-inline-block p-2 rounded">
              <h6 className="text-uppercase mb-0">Help center</h6>
            </div>
            <ul className="list-unstyled mb-0 text-center">
              <li>
                <Link to="#" className="text-white">FAQs</Link>
              </li>
              <li>
                <Link to="#" className="text-white">Contact Us</Link>
              </li>
            </ul>
          </div>
          <div className="col-lg-4 mb-4 mb-md-0 text-center"> 
            <div className="bg-secondary d-inline-block p-2 rounded">
              <h6 className="text-uppercase mb-0">Legal</h6>
            </div>
            <ul className="list-unstyled mb-0 text-center">
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
      <div className="text-center p-2 bg-secondary">
        <span className="text-sm text-white">© 2024 <Link to="https://.netlify.app" className="text-white">We Care Adult Care Timecards App™</Link>. All Rights Reserved.</span>
      </div>
    </footer>
  );
}

export default Footer;