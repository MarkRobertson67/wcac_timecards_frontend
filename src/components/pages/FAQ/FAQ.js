// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from "react";
import "./FAQ.css";

const FAQ = () => {
    
  const [activeIndex, setActiveIndex] = useState(null);

  const toggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqData = [
    {
      question: "How do I create a new timecard?",
      answer: "To create a new timecard, simply select the start date of the two-week period. The app will automatically generate the necessary timecard entries for each day within that period. Once created, you can begin entering your work hours."
    },
    {
      question: "How do I enter hours worked?",
      answer: "To enter hours worked for a specific day, select the corresponding day in your timecard, and input your start time, lunch start, lunch end, and end time. The app will calculate the total hours worked for that day."
    },
    {
      question: "Can I edit my timecard after submitting it?",
      answer: "Once a timecard has been submitted, it cannot be modified. If you need to make changes, please contact your administrator or manager for assistance."
    },
    {
      question: "How can I submit my timecard?",
      answer: "To submit your timecard, make sure all required fields are filled in for each day. Once you're satisfied with the entries, click the 'Turn in your Timecard' button. A confirmation message will appear to confirm submission."
    },
    {
      question: "What happens if I forget to fill out a day?",
      answer: "If any days are missing, you will be prompted to create the missing days before submitting your timecard."
    },
    {
    question: "Does this app use cookies",
    answer: "This App or third party apps may use cookies to enhance your experience. By continuing to use our site, you agree to our use of cookies"
    }
  ];

  return (
    <div className="faq-page">
    <div className="faq-container">
      <h1 className="faq-title">Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqData.map((item, index) => (
          <div key={index} className="faq-item">
            <div
              className={`faq-question ${activeIndex === index ? "active" : ""}`}
              onClick={() => toggle(index)}
            >
              <h2>{item.question}</h2>
              <span className="faq-toggle-icon">{activeIndex === index ? "-" : "+"}</span>
            </div>
            {activeIndex === index && <div className="faq-answer">{item.answer}</div>}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default FAQ;
