// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.


// src/components/pages/PrivacyPolicy.js
import React, { useEffect } from "react";
import styles from "./PrivacyPolicy.module.css";

const PrivacyPolicy = () => {

        // Scroll to top whenever this component is rendered
        useEffect(() => {
          window.scrollTo(0, 0); // Scroll to top of the page
        }, []);
  
        return (
          <div className={styles.ppPage}>
          <div className={styles.pageContainer}> {/* Use styles.pageContainer here */}
            <h1>Privacy Policy</h1>
            <p>
              Your privacy is important to us. This privacy policy explains what personal information we collect and how we use it.
            </p>
            
            <h2>1. Information We Collect</h2>
            <p>
              We collect personal information such as your name, email address, phone number, and work hours entered into the app. We do not collect sensitive data beyond what is required for the app’s functionality.
            </p>
      
            <h2>2. Use of Your Information</h2>
            <p>
              The information we collect is used to provide the services offered by this app, including generating timecards, tracking work hours, and managing employee data. We do not use your information for any other purposes, and we do not sell or share it with third parties outside of the app’s functionality.
            </p>
            <p>
              We use Firebase for authentication during login verification. Firebase helps manage your login securely and ensures that your personal information, like passwords, is not stored by the app or Firebase. Only necessary details to verify your identity are stored, and no sensitive data is retained.
            </p>
      
            <h2>3. Data Security</h2>
            <p>
              We take the security of your data seriously. Your personal information is stored securely, and we implement standard security measures to protect it from unauthorized access.
            </p>
      
            <h2>4. Sharing of Information</h2>
            <p>
              We do not share your personal information with third parties, except for necessary data shared with Firebase for login authentication and as required by law.
            </p>
      
            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information only as long as necessary to provide our services or as required by law. If you wish to delete your account or personal data, please contact management.
            </p>
      
            <h2>6. Updates to Privacy Policy</h2>
            <p>
              We may update this privacy policy from time to time. Any changes will be posted on this page, and your continued use of the app after changes are posted constitutes your acceptance of the updated policy.
            </p>
      
            <h2>7. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy, please reach out to us through our <a href="/contactus">Contact Us</a> page.
            </p>
          </div>
          </div>
        );
      };
      
      export default PrivacyPolicy;