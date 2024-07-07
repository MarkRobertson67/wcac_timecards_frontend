// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CreateNewTimeCard.css'; // Import the CSS file

function CreateNewTimeCard({ setIsNewTimeCardCreated }) {
  const [startDate, setStartDate] = useState(new Date());
  const navigate = useNavigate();

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleStartDateSelection = () => {
    localStorage.setItem('startDate', startDate.toISOString());
    navigate('/currentTimeCard');
  };

  return (
    <div className="center-container">
      <h2>Select Start Date</h2>
      <Calendar
        onChange={handleStartDateChange}
        value={startDate}
      />
      <button onClick={handleStartDateSelection}>Start Timecard</button>
    </div>
  );
}

export default CreateNewTimeCard;







// import React from 'react';

// function CreateNewTimeCard({ setIsNewTimeCardCreated }) {
//   const handleCreateTimeCard = () => {
//     const newTimeCard = {
//       entries: Array(14).fill({ date: '', startTime: '', lunchStart: '', lunchEnd: '', endTime: '' }),
//       isSubmitted: false
//     };
    
//     localStorage.setItem('currentTimeCard', JSON.stringify(newTimeCard));
//     setIsNewTimeCardCreated(true);
//   };

//   return (
//     <div>
//       <h2>Create New Time Card</h2>
//       <button onClick={handleCreateTimeCard}>Create</button>
//     </div>
//   );
// }

// export default CreateNewTimeCard;



// import React, { useState } from 'react';

// function CreateNewTimeCard({ setIsNewTimeCardCreated }) {
//   const [startTime, setStartTime] = useState('');
//   const [lunchStart, setLunchStart] = useState('');
//   const [lunchEnd, setLunchEnd] = useState('');
//   const [endTime, setEndTime] = useState('');
//   const [date, setDate] = useState('');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const newTimeCard = { date, startTime, lunchStart, lunchEnd, endTime };
    
//     // TODO: Add logic to save the new time card, e.g., make an API call to the backend

//     setIsNewTimeCardCreated(true);

//     // Clear the form
//     setDate('');
//     setStartTime('');
//     setLunchStart('');
//     setLunchEnd('');
//     setEndTime('');
//   };

//   return (
//     <div>
//       <h2>Create New Time Card</h2>
//       <form onSubmit={handleSubmit}>
//         <div>
//           <label>Date:</label>
//           <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
//         </div>
//         <div>
//           <label>Start Time:</label>
//           <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
//         </div>
//         <div>
//           <label>Lunch Start:</label>
//           <input type="time" value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} required />
//         </div>
//         <div>
//           <label>Lunch End:</label>
//           <input type="time" value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} required />
//         </div>
//         <div>
//           <label>End Time:</label>
//           <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
//         </div>
//         <button type="submit">Save</button>
//       </form>
//     </div>
//   );
// }

// export default CreateNewTimeCard;









// import React from 'react';


// function CreateNewTimeCard({ setIsNewTimeCardCreated }) {
//   const handleCreateTimeCard = () => {
//     // Put your logic to create a new time card
//     setIsNewTimeCardCreated(false);
//   };

//   return (
//     <div>
//       <h2>Create New Time Card</h2>
//       <button onClick={handleCreateTimeCard}>Create</button>
//     </div>
//   );
// }

// export default CreateNewTimeCard;

