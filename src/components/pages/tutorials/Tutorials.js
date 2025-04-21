// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, { useEffect } from 'react';
import styles from './Tutorials.module.css';

function AboutComponent() {

  // Scroll to top whenever this component is rendered
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top of the page
  }, []);

  return (
    <div className={styles.acPage}>
      {/* Title: Centered */}
      <h1 className={styles.title}>Welcome to the Timecards Tutorials Hub!</h1>
      <p className={styles.description}>
        Ready to get started? Check out our easy-to-follow guides to help you set up and navigate the WCAC Timecards application with ease.
      </p>

      <div className={styles.section}>
        {/* Left side: Text */}
        <div className={styles.textContent}>
          <h2 className={styles.subtitle}>Creating and Verifying Your Account</h2>
          <p className={styles.description}>
            New to WCAC Timesheets? First, let's get you set up! Follow this guide to create your account and verify your email:
          </p>
          <p className={styles.linkText}>
            <a
              href="https://scribehow.com/shared/How_to_Sign_Up_and_Verify_Your_WCAC_Account__1XqE3DCjS_y8xMZd_6Q9aQ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>How to Create a New Account and Verify Your Email</strong>
            </a>
          </p>
        </div>

        {/* Right side: Screenshot */}
        <div className={styles.imageContent}>
          <div className={styles.screenshot}>
            <img
              src="/LogInScreenshot.png"
              alt="Account creation screenshot"
              className={styles.screenshotImage}
            />
            <p className={styles.screenshotCaption}>Step 1: Account Creation Screen</p>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        {/* Left side: Text */}
        <div className={styles.textContent}>
          <h2 className={styles.subtitle}>Creating and Submitting Your Timecard</h2>
          <p className={styles.description}>
            Ready to submit your time? This guide will walk you through creating and submitting a timecard online, step-by-step:
          </p>
          <p className={styles.linkText}>
            <a
              href="https://scribehow.com/shared/How_to_Submit_a_Timecard_in_WCAC_Timesheets__nrwAcZa2TC66j8Ly2v0JQQ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>How to Create and Submit a Timecard Online</strong>
            </a>
          </p>
        </div>

        {/* Right side: Screenshot */}
        <div className={styles.imageContent}>
          <div className={styles.screenshot}>
            <img
              src="/TimeCardScreenshot.png"
              alt="Timecard submission screenshot"
              className={styles.screenshotImage}
            />
            <p className={styles.screenshotCaption}>Step 2: Timecard Submission Screen</p>
          </div>
        </div>
      </div>

      {/* Contact Us and FAQ Links */}
      <div className={styles.noteSection}>
        <p className={styles.note}>
          Need more help? Don’t hesitate to reach out to our support team for any questions or additional guidance!
        </p>
        <p className={styles.linkText}>
          <a
            href="/contactus"
            className={styles.contactUsLink}
          >
            Contact Us
          </a>
        </p>
        <p className={styles.linkText}>
          <a
            href="/faq"
            className={styles.faqLink}
          >
            FAQ
          </a>
        </p>
      </div>
    </div>
  );
}

export default AboutComponent;
