// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./CreateNewTimeCard.module.css";

function CreateNewTimeCard({ setIsNewTimeCardCreated }) {
  const [startDate, setStartDate] = useState(new Date());
  const navigate = useNavigate();
  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  // Call this method on logout or when you need to ensure fresh data is loaded
  const clearLocalStorage = () => {
    localStorage.removeItem("activeTimeCard");
    localStorage.removeItem("startDate");
  };

  const formatDate = (date) => {
    // Format the date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2); // Adding 1 since getMonth() returns 0-11
    const day = `0${date.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  const handleStartDateSelection = () => {
    clearLocalStorage();
    // Format the date and store it in localStorage
    const formattedDate = formatDate(startDate);
    localStorage.setItem("startDate", formattedDate);

    setIsNewTimeCardCreated(true);
    navigate("/activeTimeCard", { state: { startDate: formattedDate } });
  };

  return (
    <div className={styles.container}>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className={styles.card}>
            {/* text-center to center all elements inside */}
            <div className={`${styles.cardBody} text-center`}>
              <h2 className={styles.cardTitle} style={{ marginBottom: "40px" }}>
                Create New Time Card
              </h2>

              <div className="d-flex justify-content-center">
                <Calendar
                  onChange={handleStartDateChange}
                  value={startDate}
                  locale="en-US"
                />
              </div>

              <button
                onClick={handleStartDateSelection}
                className={`btn btn-primary ${styles.button}`}
                style={{ marginTop: '40px' }}
              >
                View / Create Time Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateNewTimeCard;
