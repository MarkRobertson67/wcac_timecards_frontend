// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ActiveTimeCard.module.css';
import { startOfWeek, addDays, format } from 'date-fns';

const API = process.env.REACT_APP_API_URL;

function ActiveTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const navigate = useNavigate();
  const employeeId = 1;


  const getPreviousMonday = (date) => {
    const result = date.getDay() === 0 ? addDays(date, 1) : startOfWeek(date, { weekStartsOn: 1 });
    return result;
  };


// Generates initial timecard entries for the specified start date.
// This function calculates a two-week period starting from the previous Monday,
// excluding weekends. It iterates through 14 days, adding an entry only for weekdays,
// ensuring that timecard entries align with business days.

  const generateInitialEntries = useCallback((startDate) => {
    let currentDate = getPreviousMonday(startDate);
    let entries = [];
    for (let i = 0; i < 14; i++) {
        if (isWeekday(format(currentDate, 'yyyy-MM-dd'))) {
            entries.push({
                date: format(currentDate, 'yyyy-MM-dd'),
                startTime: '',
                lunchStart: '',
                lunchEnd: '',
                endTime: '',
                totalTime: ''
            });
        }
        currentDate = addDays(currentDate, 1);
    }
    return entries;
}, []);


  useEffect(() => {
    const savedTimeCard = JSON.parse(localStorage.getItem('currentTimeCard'));
    const storedStartDate = localStorage.getItem('startDate');
    // console.log('Stored Start Date:', storedStartDate);
    if (savedTimeCard && storedStartDate) {
      // console.log('Using Saved Time Card:', savedTimeCard);
      setTimeCard(savedTimeCard);
    } else if (storedStartDate) {
      setTimeCard({
        entries: generateInitialEntries(new Date(storedStartDate)),
        isSubmitted: false
      });
    }
  }, [generateInitialEntries]);


  const calculateTotalTime = (start, lunchStart, lunchEnd, end) => {
    const parseTime = (time) => time ? new Date(`1970-01-01T${time}:00`) : null;
    const startTime = parseTime(start);
    const lunchStartTime = parseTime(lunchStart);
    const lunchEndTime = parseTime(lunchEnd);
    const endTime = parseTime(end);

    let totalMinutes = 0;

    if (startTime && lunchStartTime) {
      totalMinutes += (lunchStartTime - startTime) / (1000 * 60);
    }

    if (lunchEndTime && endTime) {
      totalMinutes += (endTime - lunchEndTime) / (1000 * 60);
    }

    if (startTime && endTime && !lunchStartTime && !lunchEndTime) {
      totalMinutes = (endTime - startTime) / (1000 * 60);
    }

    if (startTime && lunchStartTime && lunchEndTime && !endTime) {
      totalMinutes = (lunchStartTime - startTime) / (1000 * 60);
    }

    totalMinutes = Math.max(totalMinutes, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const totalTime = `${hours}h ${minutes}m`;
    console.log('Calculated Total Time:', totalTime);
    return totalTime;
  };


  const formatDate = (dateString) => {
    const formattedDate = format(new Date(dateString), 'eeee, MMM d, yyyy');
    // console.log('Formatted Date:', formattedDate);
    return formattedDate;
  };


  const isWeekday = (dateString) => {
    const date = new Date(dateString);
    return date.getDay() !== 0 && date.getDay() !== 6;
  };


  const handleChange = async (index, field, value) => {
    setTimeCard(prevState => {
      // Find the correct entry by date or some other identifier if index doesn't match because of filtering
      const entryToUpdate = prevState.entries.find((e, idx) => isWeekday(e.date) && idx === index);
      if (entryToUpdate) {
        entryToUpdate[field] = value;
        entryToUpdate.totalTime = calculateTotalTime(
          entryToUpdate.startTime,
          entryToUpdate.lunchStart,
          entryToUpdate.lunchEnd,
          entryToUpdate.endTime
        );
      }
      return { ...prevState };
    });
  };
  
// not implemented yet.
// const updateEntryInDatabase = async (index, entry) => {
//     // Determine whether to POST new or PUT existing entry based on ID presence
//     const method = entry.id ? 'PUT' : 'POST';
//     const url = `${API}/timecards${entry.id ? `/${entry.id}` : ''}`;

//     const requestPayload = {
//       employee_id: employeeId,
//       work_date: entry.date,
//       start_time: entry.startTime || null,
//       lunch_start: entry.lunchStart || null,
//       lunch_end: entry.lunchEnd || null,
//       end_time: entry.endTime || null,
//       total_time: entry.totalTime || null
//     };

//     try {
//       const response = await fetch(url, {
//         method: method,
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(requestPayload)
//       });

//       const result = await response.json();
//       if (!response.ok) {
//         throw new Error(result.error);
//       }

//       // Update the entry ID for newly created entries
//       if (!entry.id) {
//         setTimeCard(prevState => {
//           const updatedEntries = [...prevState.entries];
//           updatedEntries[index].id = result.data.id;
//           return { ...prevState, entries: updatedEntries };
//         });
//       }
//     } catch (error) {
//       console.error(`Error during ${method} operation:`, error);
//     }
// };

  const handleSubmit = async () => {
    try {
      await Promise.all(
        timeCard.entries.map(async (entry) => {
          const response = await fetch(`${API}/timecards${entry.id ? `/${entry.id}` : ''}`, {
            method: entry.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employee_id: employeeId,
              work_date: entry.date,
              start_time: entry.startTime,
              lunch_start: entry.lunchStart,
              lunch_end: entry.lunchEnd,
              end_time: entry.endTime,
              total_time: entry.totalTime,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to submit timecard');
          }
        })
      );

      console.log('Time Card Submitted Successfully');
      setTimeCard({ entries: [], isSubmitted: true });
      setIsNewTimeCardCreated(false);
      navigate('/');
    } catch (error) {
      console.error('Error submitting timecard:', error);
    }
  };

  const handleReset = () => {
    setTimeCard({ entries: [], isSubmitted: false });
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
    setIsNewTimeCardCreated(false);
    navigate('/createNewTimeCard');
  };

  // Filtered Entries
  const filteredEntries = timeCard.entries.filter(entry => isWeekday(entry.date));

  return (
    <div className={`container mt-5 ${styles.container}`}>
      <div className="text-center mb-3">
        <button className="btn btn-primary me-3" onClick={handleSubmit}>Submit</button>
        <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
      </div>
      <h2 className="text-center mb-4">Active Timecard</h2>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Date</th>
              <th>Start Time</th>
              <th>Lunch Start</th>
              <th>Lunch End</th>
              <th>End Time</th>
              <th>Total Time</th>
            </tr>
          </thead>
          <tbody>
            {/* timeCard.entries.filter(isWeekday) */}
            {filteredEntries.map((entry, index) => (
              <tr key={entry.date}>
                <td>{formatDate(entry.date)}</td>
                <td><input type="time" value={entry.startTime} onChange={(e) => handleChange(index, 'startTime', e.target.value)} /></td>
                <td><input type="time" value={entry.lunchStart} onChange={(e) => handleChange(index, 'lunchStart', e.target.value)} /></td>
                <td><input type="time" value={entry.lunchEnd} onChange={(e) => handleChange(index, 'lunchEnd', e.target.value)} /></td>
                <td><input type="time" value={entry.endTime} onChange={(e) => handleChange(index, 'endTime', e.target.value)} /></td>
                <td>{entry.totalTime}</td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

export default ActiveTimeCard;
