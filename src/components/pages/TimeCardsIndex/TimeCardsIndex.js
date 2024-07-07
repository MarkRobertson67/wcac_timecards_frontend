// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
// import axios from 'axios';

function TimeCardsIndex() {
  const [timeEntries, setTimeEntries] = useState([]);

  // useEffect(() => {
  //   // Fetch time cards from the backend
  //   const fetchTimeEntries = async () => {
  //     try {
  //       const response = await axios.get('/api/timecards');
  //       setTimeEntries(response.data);
  //     } catch (error) {
  //       console.error('Error fetching time entries:', error);
  //     }
  //   };

  //   fetchTimeEntries();
  // }, []);

  return (
    <div>
      <h2>Time Card Index</h2>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={timeEntries.map((entry) => ({
          title: 'Work Day',
          start: entry.date,
          end: entry.date,
        }))}
      />
      <div>
        <h3>Time Entries</h3>
        <ul>
          {timeEntries.map((entry, index) => (
            <li key={index}>
              Date: {entry.date}, Start: {entry.startTime}, Lunch Start: {entry.lunchStart}, Lunch End: {entry.lunchEnd}, End: {entry.endTime}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TimeCardsIndex;





// import React from 'react';

// function TimeCardsIndex() {
//   return (
//     <div>
//       <h2>Time Card Index</h2>
//       {/* Add the content for past time cards */}
//     </div>
//   );
// }

// export default TimeCardsIndex;

