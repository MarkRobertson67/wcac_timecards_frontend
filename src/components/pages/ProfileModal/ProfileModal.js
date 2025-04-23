// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from "react";
import { auth } from "../../../firebase/firebaseConfig";

function ProfileModal({ onSave,  onCancel }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState(""); 

  const API = process.env.REACT_APP_API_URL;

  const handleSave = async () => {
    if (!firstName || !lastName || !phone || !position) {
      alert("Please complete all fields");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("User is not logged in");
      return;
    }

    const employeeData = {
      firebase_uid: user.uid,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      phone,
      position,
    };

    try {
      const response = await fetch(`${API}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });
      if (!response.ok) throw new Error("Failed to save employee profile");
      await response.json();
      onSave();   // notify parent that save succeeded
    } catch (error) {
      console.error("Error saving employee profile:", error);
      alert("Error saving profile");
    }
  };


  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setPhone(formattedPhone);
  };

  return (
    <div
      className="modal show"
      tabIndex="-1"
      style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Complete Your Profile</h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onCancel}
            ></button>
          </div>
          <div className="modal-body">
            <p>Welcome! Please complete your profile. Select your position based
              on your role. If you work in the facility only, choose "Facility."
              If you drive and work in the facility, select "Driver, Facility."</p>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Phone Number"
                value={phone}
                onChange={handlePhoneChange}
              />
            </div>
            <div className="mb-3">
              <select
                className="form-select"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                <option value="">Select Position</option>
                <option value="Driver">Driver</option>
                <option value="Facility">Facility</option>
                <option value="Driver, Facility">Driver, Facility</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
            >
              Save Profile
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
