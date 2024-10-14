// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from './CreateNewTimeCard.module.css';

function CreateNewTimeCard({ setIsNewTimeCardCreated }) {
  const [startDate, setStartDate] = useState(new Date());
  const navigate = useNavigate();

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

   // Call this method on logout or when you need to ensure fresh data is loaded
  const clearLocalStorage = () => {
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
  };

  const formatDate = (date) => {
    // Format the date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2); // Adding 1 since getMonth() returns 0-11
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  };

  const handleStartDateSelection = () => {
    clearLocalStorage();
    // Format the date and store it in localStorage
    const formattedDate = formatDate(startDate);
    localStorage.setItem('startDate', formattedDate);

    setIsNewTimeCardCreated(true);
    navigate('/currentTimeCard', { state: { startDate: formattedDate } });
  };

  return (
    <div className={styles.container}>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>Create New Time Card</h2>
              <Calendar 
                onChange={handleStartDateChange} 
                value={startDate} 
                locale="en-US" 
              />
              <button 
                onClick={handleStartDateSelection} 
                className={`btn btn-primary ${styles.button}`}
              >
                Create Time Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateNewTimeCard;


