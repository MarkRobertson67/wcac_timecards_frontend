// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState } from "react";
import emailjs from "emailjs-com";
import styles from "./ContactUs.module.css"

const ContactUs = () => {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare the form data
    const formData = {
      from_name: name,
      from_email: email,
      message,
    };

    // Send the email using EmailJS
    emailjs
      .send(
        "service_rbo3lcb",
        "template_pkn8xon",
        formData,
        "kyrfTrBDTp5yrt7DC"
      )
      .then(
        (response) => {
          alert("Message sent successfully!");
          // Reset form fields
          setName("");
          setEmail("");
          setMessage("");
        },
        (error) => {
          alert("Failed to send message, please try again later.");
          console.error(error.text);
        }
      );
  };

  return (
    <div className={styles.cuPage}>
    <div
      className="container my-5 contact-form-container"
      style={{ maxWidth: "600px" }}
    >
      <h1 className="text-center mb-4">Contact Us</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="from_name" className="form-label">
            Name:
          </label>
          <input
            type="text"
            className="form-control"
            id="from_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="from_email" className="form-label">
            Email:
          </label>
          <input
            type="email"
            className="form-control"
            id="from_email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="message" className="form-label">
            Message:
          </label>
          <textarea
            className="form-control"
            id="message"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <div className="d-flex justify-content-center">
          <button type="submit" className="btn btn-primary btn-lg">
            Send Message
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default ContactUs;
