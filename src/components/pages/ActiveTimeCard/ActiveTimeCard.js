// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ActiveTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const navigate = useNavigate();

  useEffect(() => {
    const savedTimeCard = JSON.parse(localStorage.getItem('currentTimeCard'));
    const startDate = localStorage.getItem('startDate');
    if (savedTimeCard && startDate) {
      setTimeCard(savedTimeCard);
    } else if (startDate) {
      // Initialize the time card with empty entries for two weeks
      const start = new Date(startDate);
      const endDate = new Date(start);
      endDate.setDate(endDate.getDate() + 13); // Two weeks later

      const initialEntries = [];
      let currentDate = new Date(start);
      while (currentDate <= endDate) {
        initialEntries.push({
          date: currentDate.toISOString().slice(0, 10), // Format as yyyy-mm-dd
          startTime: '',
          lunchStart: '',
          lunchEnd: '',
          endTime: ''
        });
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      setTimeCard({ entries: initialEntries, isSubmitted: false });
      localStorage.setItem('currentTimeCard', JSON.stringify({ entries: initialEntries, isSubmitted: false }));
    }
  }, []);

  const handleChange = (index, field, value) => {
    const updatedEntries = timeCard.entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    const updatedTimeCard = { ...timeCard, entries: updatedEntries };
    setTimeCard(updatedTimeCard);
    localStorage.setItem('currentTimeCard', JSON.stringify(updatedTimeCard));
  };

  const handleSubmit = () => {
    // Send `timeCard` data to the backend 
    // After successful submission, clear localStorage and reset timeCard state
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
    setTimeCard({ entries: [], isSubmitted: false });
    setIsNewTimeCardCreated(false); // Set to false to show "Create New Time Card" in NavBar
    navigate('/'); // Navigate to home page
  };

  const handleReset = () => {
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
    setTimeCard({ entries: [], isSubmitted: false });
    setIsNewTimeCardCreated(false); // Set to false to show "Create New Time Card" in NavBar
    navigate('/createNewTimeCard'); // Navigate back to create new time card
  };

  return (
    <div className="center-container">
      <div className="current-time-card">
        <h2>Current Time Card</h2>
        {timeCard.entries.map((entry, index) => (
          <div key={index}>
            <label>Date:</label>
            <input
              type="date"
              value={entry.date}
              onChange={(e) => handleChange(index, 'date', e.target.value)}
              disabled={timeCard.isSubmitted}
            />
            <label>Start Time:</label>
            <input
              type="time"
              value={entry.startTime}
              onChange={(e) => handleChange(index, 'startTime', e.target.value)}
              disabled={timeCard.isSubmitted}
            />
            <label>Lunch Start:</label>
            <input
              type="time"
              value={entry.lunchStart}
              onChange={(e) => handleChange(index, 'lunchStart', e.target.value)}
              disabled={timeCard.isSubmitted}
            />
            <label>Lunch End:</label>
            <input
              type="time"
              value={entry.lunchEnd}
              onChange={(e) => handleChange(index, 'lunchEnd', e.target.value)}
              disabled={timeCard.isSubmitted}
            />
            <label>End Time:</label>
            <input
              type="time"
              value={entry.endTime}
              onChange={(e) => handleChange(index, 'endTime', e.target.value)}
              disabled={timeCard.isSubmitted}
            />
          </div>
        ))}
        {!timeCard.isSubmitted && <button onClick={handleSubmit}>Submit Time Card</button>}
        <button onClick={handleReset}>Reset Time Card</button>
      </div>
    </div>
  );
}

export default ActiveTimeCard;
