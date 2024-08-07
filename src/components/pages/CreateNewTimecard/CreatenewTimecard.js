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

  const handleStartDateSelection = () => {
    // Store the date as an ISO string
    const isoDate = startDate.toISOString();
    localStorage.setItem('startDate', isoDate);

    setIsNewTimeCardCreated(true);
    navigate('/currentTimeCard', { state: { startDate: isoDate } });
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




