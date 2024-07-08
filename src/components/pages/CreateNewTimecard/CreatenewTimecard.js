// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CreateNewTimeCard.css';

function CreateNewTimeCard({ setIsNewTimeCardCreated }) {
  const [startDate, setStartDate] = useState(new Date());
  const navigate = useNavigate();

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleStartDateSelection = () => {
    localStorage.setItem('startDate', startDate.toISOString());
    setIsNewTimeCardCreated(true); // Update the state to indicate a new time card is created
    navigate('/currentTimeCard', { replace: true }); // Navigate to current time card, replacing the history entry
  };

  return (
    <div className="center-container">
      <h2>Select Start Date</h2>
      <Calendar onChange={handleStartDateChange} value={startDate} />
      <button onClick={handleStartDateSelection}>Start Timecard</button>
    </div>
  );
}

export default CreateNewTimeCard;
