// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useEffect, useState } from "react";
import styles from "./FAQ.module.css"; // Import the styles module

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Scroll to top whenever this component is rendered
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top of the page
  }, []);

  const faqData = [
    {
      question: "How do I create a new timecard?",
      answer:
        "To create a new timecard, simply select the start date of the two-week period. The app will automatically generate the necessary timecard entries for each day within that period. Once created, you can begin entering your work hours.",
    },
    {
      question: "How do I enter hours worked?",
      answer:
        "To enter hours worked for a specific day, select the corresponding day in your timecard, and input your start time, lunch start, lunch end, and end time. If applicable, select either 'Driving' or 'Facility' first. For example, if you worked part of the morning driving and part in the Facility, enter Facility hours first, then select Driving and enter your driving hours. The hours are tracked separately and can be viewed in the TimeCard Index page. If you only worked in the afternoon, start your afternoon hours with lunch end. Please do not try to enter afternoon hours in the morning section. The app will calculate the total hours worked for the day.",
    },
    {
      question: "Can I edit my timecard after submitting it?",
      answer:
        "Once a timecard has been submitted, it cannot be modified. If you need to make changes, please contact your administrator or manager for assistance.",
    },
    {
      question: "How can I submit my timecard?",
      answer:
        "To submit your timecard, ensure all required fields are filled in for each day of the entire 2-week period. Once you're satisfied with the entries and the total times are correct, click the 'Turn in your Timecard' button. A confirmation message will appear to confirm submission.",
    },
    {
      question: "What happens if I forget to fill out a day?",
      answer:
        "If any days are missing, you will be prompted to create the missing days before submitting your timecard. You can make changes to any day of the 2-week period until you submit your timecard.",
    },
    {
      question: "Does this app use cookies?",
      answer: (
        <>
          This app, or third-party apps, may use cookies to enhance your
          experience. By continuing to use the site, you agree to our use of
          cookies. Please see our{" "}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms & Conditions
          </a>{" "}
          for more information.
        </>
      ),
    },
  ];

  return (
    <div className={styles.faqPage}>
      <div className={styles.faqContainer}>
        <h1 className={styles.faqTitle}>Frequently Asked Questions</h1>
        <div className={styles.faqList}>
          {faqData.map((item, index) => (
            <div key={index} className={styles.faqItem}>
              <div
                className={`${styles.faqQuestion} ${
                  activeIndex === index ? styles.active : ""
                }`}
                onClick={() => toggle(index)}
              >
                <h2>{item.question}</h2>
                <span className={styles.faqToggleIcon}>
                  {activeIndex === index ? "-" : "+"}
                </span>
              </div>
              {activeIndex === index && (
                <div className={styles.faqAnswer}>{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
