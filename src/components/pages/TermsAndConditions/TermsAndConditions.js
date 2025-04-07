// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

// src/components/pages/TermsAndConditions.js
import React, { useEffect } from "react";
import styles from "./TermsAndConditions.module.css";



const TermsAndConditions = () => {

    // Scroll to top whenever this component is rendered
    useEffect(() => {
      window.scrollTo(0, 0); // Scroll to top of the page
    }, []);

    
  return (
    <div className={styles.TaCPage}>
    <div className={styles.pageContainer}>
      <h1>Terms and Conditions</h1>
      <p>
        These Terms and Conditions govern your use of the Timecard Application
        ("the app"). By accessing or using the app, you agree to comply with and
        be bound by these terms. If you do not agree with these terms, please
        refrain from using the app and contact management.
      </p>

      <section className={styles.section}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By using this app, you agree to these Terms and Conditions. If you do
          not agree with any part of these terms, you must stop using the app
          immediately. We reserve the right to modify these terms at any time,
          and all modifications will take effect once posted in the app.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. License Grant</h2>
        <p>
          We Care Adult Care has been granted a free, non-transferable, and
          non-exclusive license to use this TimeCard app solely for professional
          purposes, within the scope of its intended use. This license is
          provided for use only by employees within the organization using the
          app. You are not permitted to distribute, resell, or reverse-engineer
          the app.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. User Responsibilities</h2>
        <p>
          You are responsible for all actions taken under your user account.
          This includes keeping your login credentials secure and confidential.
          You agree not to use the app for any unlawful purpose or in a manner
          that could damage, disable, or impair the app’s functionality.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Data Collection and Privacy</h2>
        <p>
          We collect only the information you provide when using the app. This
          may include personal data such as your name, email phone, and timecard
          entries. For authentication, we use third-party services like Firebase
          for login verification, which may collect certain data for
          authentication purposes. See Privacy Policy for more information.
        </p>
        <p>
          We do not collect any sensitive personal information beyond what is
          necessary for your use of the app. All data is stored securely and
          used only in accordance with the app’s functionality. You can refer to
          our Privacy Policy for further details on how we handle your data.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Use of the App</h2>
        <p>
          The app is intended solely for the management and tracking of employee
          timecards. You may use the app to log work hours, view reports, and
          track employee attendance within the designated two-week time periods.
          Any use of the app outside of these purposes, including, but not
          limited to, unauthorized access or misuse of the app’s features, is
          prohibited.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Intellectual Property</h2>
        <p>
          All content and intellectual property rights associated with the app,
          including but not limited to software, text, and design elements, are
          owned by the app’s creator, Mark Robertson. You are not permitted to
          copy, modify, or distribute any content from the app without express
          permission.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Limitations of Liability</h2>
        <p>
          The app is provided “as is” without warranties of any kind. We make no
          representations or warranties regarding the accuracy, reliability, or
          availability of the app. We are not liable for any damages, losses, or
          issues arising from the use or inability to use the app, including but
          not limited to data loss, downtime, or errors in time tracking.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your access to the app at
          any time, without prior notice, for any violation of these terms or if
          we believe you are engaging in unauthorized activities.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Modifications</h2>
        <p>
          We may update or modify the app and its Terms and Conditions from time
          to time. Any changes will be posted on this page, and your continued
          use of the app after such changes constitutes your acceptance of the
          updated terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Governing Law and Dispute Resolution</h2>
        <p>
          These Terms and Conditions are governed by the laws of New Jersey. Any
          disputes arising from your use of the app will first be addressed
          through mediation in New Jersey. If mediation is unsuccessful, the
          dispute may be resolved in the appropriate courts in New Jersey. Both
          parties agree to engage in good faith mediation prior to any legal
          action.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Contact Information</h2>
        <p>
          If you have any questions or concerns regarding these Terms and
          Conditions, please reach out to us through our{" "}
          <a href="/contactus">Contact Us</a> page.
        </p>
      </section>

      <p>
        By using this app, you acknowledge that you have read, understood, and
        agreed to these Terms and Conditions.
      </p>
    </div>
    </div>
  );
};

export default TermsAndConditions;
