// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
// import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';

function CurrentTimeCard() {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });

  useEffect(() => {
    const savedTimeCard = JSON.parse(localStorage.getItem('currentTimeCard'));
    if (savedTimeCard) {
      setTimeCard(savedTimeCard);
    }
  }, []);

  const handleChange = (index, field, value) => {
    const updatedEntries = timeCard.entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    setTimeCard({ ...timeCard, entries: updatedEntries });
    localStorage.setItem('currentTimeCard', JSON.stringify({ ...timeCard, entries: updatedEntries }));
  };

  const handleSubmit = () => {
    const updatedTimeCard = { ...timeCard, isSubmitted: true };
    setTimeCard(updatedTimeCard);
    localStorage.setItem('currentTimeCard', JSON.stringify(updatedTimeCard));
  };

  return (
    <div>
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
    </div>
  );
}

export default CurrentTimeCard;









// import React from 'react';

// function currentTimeCard() {
//   return (
//     <div>
//       <h2>Current Time Card</h2>
//       {/* Add your content for the current time card */}
//     </div>
//   );
// }

// export default currentTimeCard;

