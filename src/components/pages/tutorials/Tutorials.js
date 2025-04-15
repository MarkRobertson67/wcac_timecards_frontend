// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, {useEffect} from 'react';
import styles from './Tutorials.module.css';

function AboutComponent() {

            // Scroll to top whenever this component is rendered
            useEffect(() => {
                window.scrollTo(0, 0); // Scroll to top of the page
              }, []);

  return (
    <div className={styles.acPage}>
      <h1 className={styles.title}>Welcome to the Timecards Tutorials Page</h1>
      <p className={styles.description}>
        To learn how to create a new account and verify your email, please visit the guide:
      </p>
      <p className={styles.linkText}>
        <a
          href="https://scribehow.com/shared/How_to_Sign_Up_and_Verify_Your_WCAC_Account__1XqE3DCjS_y8xMZd_6Q9aQ"
          target="_blank"
          rel="noopener noreferrer"
        >
          How to Create a New Account Online
        </a>
      </p>

      <p className={styles.description}>
        To learn more about how to create a new time card online, please visit the guide:
      </p>
      <p className={styles.linkText}>
        <a
          href="https://scribehow.com/shared/How_To_Create_A_New_Time_Card_Online__QVlOmQ_QRFS0ejBRGI5GPQ"
          target="_blank"
          rel="noopener noreferrer"
        >
          How to Create a New Time Card Online
        </a>
      </p>
    </div>
  );
}

export default AboutComponent;

