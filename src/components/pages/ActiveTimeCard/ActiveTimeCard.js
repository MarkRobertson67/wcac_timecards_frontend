// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ActiveTimeCard.module.css';
import moment from 'moment-timezone';

const API = process.env.REACT_APP_API_URL;

function ActiveTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const navigate = useNavigate();
  const employeeId = 1;

  const getPreviousMonday = (date) => {
    const day = moment(date).day();
    if (day === 0) {
      // If the selected day is Sunday (0), start from the next day (Monday)
      return moment(date).add(1, 'days');
    } else {
      // Otherwise, get the previous Monday
      return moment(date).startOf('week').add(1, 'days');
    }
  };

  const getEndDate = (startDate) => {
    return moment(startDate).add(13, 'days'); // Two-week period
  };



  const fetchTimeCardData = async (startDate) => {
    try {
      // Get the Monday prior or following based on the selected date
    const adjustedStartDate = getPreviousMonday(startDate);
      const endDate = getEndDate(adjustedStartDate);
      const formattedStart = moment.utc(adjustedStartDate).format('YYYY-MM-DD');
      const formattedEnd = moment.utc(endDate).format('YYYY-MM-DD');
      console.log("Fetching data from", formattedStart, "to", formattedEnd); // Log range
  
      const response = await fetch(`${API}/timecards/employee/${employeeId}/range/${formattedStart}/${formattedEnd}`);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const fetchedData = await response.json();
      console.log("Fetched data:", fetchedData);  // Log the raw data for debugging
      
      let initialEntries = generateInitialEntries(adjustedStartDate);
  
      // Merge fetched data with initial entries based on the work_date
      if (fetchedData && Array.isArray(fetchedData.data) && fetchedData.data.length > 0) {
        initialEntries = initialEntries.map((entry) => {
          const foundData = fetchedData.data.find((data) => {
            // Log the raw work_date value before formatting
            console.log("Raw work_date from fetched data:", data.work_date);
  
            // Convert both dates to UTC for comparison
            const entryDate = moment.utc(entry.date).format('YYYY-MM-DD');
            const workDate = moment.utc(data.work_date).format('YYYY-MM-DD');
  
            // Log both the entryDate and workDate after formatting
            console.log("Formatted entryDate in UTC:", entryDate);
            console.log("Formatted workDate in UTC:", workDate);
  
            return entryDate === workDate;
          });
  
          // Log foundData to see if the match was successful
          console.log("Matched data for entry:", foundData);
  
          return foundData
            ? {
                ...entry,
                startTime: foundData.start_time || '',
                lunchStart: foundData.lunch_start || '',
                lunchEnd: foundData.lunch_end || '',
                endTime: foundData.end_time || '',
                totalTime: `${foundData.total_time.hours}h ${foundData.total_time.minutes}m` || '',
                status: foundData.status, // Ensure the status is also updated from fetched data
              }
            : entry;
        });
      }
  
      // Update the state to trigger re-render
      setTimeCard({ entries: initialEntries, isSubmitted: false });
      console.log("Updated TimeCard entries:", initialEntries); // Log updated entries
    } catch (error) {
      console.error('Error fetching timecard data:', error);
      setTimeCard({ entries: generateInitialEntries(startDate), isSubmitted: false });
    }
  };
  
  
  
  
  


  const generateInitialEntries = useCallback((startDate) => {
    let currentDate = getPreviousMonday(startDate);
    let entries = [];
    for (let i = 0; i < 14; i++) {
      if (isWeekday(currentDate)) {
        entries.push({
          date: moment(currentDate).format('YYYY-MM-DD'), // UTC
          startTime: '',
          lunchStart: '',
          lunchEnd: '',
          endTime: '',
          totalTime: '',
          status: '',
        });
      }
      currentDate = moment(currentDate).add(1, 'day');
    }
    return entries;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const storedStartDateStr = localStorage.getItem('startDate');
      const startDate = storedStartDateStr ? moment(storedStartDateStr) : moment();
      await fetchTimeCardData(startDate);
    };

    fetchData();
  }, []);

  const calculateTotalTime = (start, lunchStart, lunchEnd, end) => {
    const parseTime = (time) => (time ? moment(`1970-01-01T${time}:00Z`) : null);
    const startTime = parseTime(start);
    const lunchStartTime = parseTime(lunchStart);
    const lunchEndTime = parseTime(lunchEnd);
    const endTime = parseTime(end);

    let totalMinutes = 0;

    if (startTime && lunchStartTime) {
      totalMinutes += lunchStartTime.diff(startTime, 'minutes');
    }

    if (lunchEndTime && endTime) {
      totalMinutes += endTime.diff(lunchEndTime, 'minutes');
    }

    totalMinutes = Math.max(totalMinutes, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const totalTime = `${hours}h ${minutes}m`;
    console.log('Calculated Total Time:', totalTime);
    return totalTime || '';
  };

  const isWeekday = (date) => {
    const day = moment(date).day();
    return day !== 0 && day !== 6; // Not Sunday (0) or Saturday (6)
  };



  const handleChange = async (index, field, value) => {
    console.log(`handleChange called for index: ${index}, field: ${field}, value: ${value}`);
    setTimeCard((prevState) => {
      const entries = [...prevState.entries];
      const entryToUpdate = entries.find((e, idx) => isWeekday(e.date) && idx === index);

      if (!entryToUpdate || entryToUpdate.status === 'submitted') {
        alert('Cannot update a submitted timecard');
        return prevState;
      }

      entryToUpdate[field] = value;

      entryToUpdate.totalTime = calculateTotalTime(
        entryToUpdate.startTime,
        entryToUpdate.lunchStart,
        entryToUpdate.lunchEnd,
        entryToUpdate.endTime
      );

      // Log which method will be used for the update
    console.log(`Updating entry: ${entryToUpdate.id ? 'PUT' : 'POST'} method`);
    console.log('Updated entry before saving:', entryToUpdate);

      // Set the status to 'active' if not already submitted
      if (entryToUpdate.status !== 'submitted') {
      entryToUpdate.status = 'active';
    }

    // Check if this entry has an ID, and use PUT to update instead of POST
    if (entryToUpdate.id) {
      updateEntryInDatabase(index, entryToUpdate);
    } else {
      updateEntryInDatabase(index, entryToUpdate);
    }

    return { ...prevState, entries };
  });
};


  const updateEntryInDatabase = async (index, entry) => {
     // Clear any previous timeout to prevent multiple updates being sent in quick succession
  clearTimeout(entry.updateTimeout);

  entry.updateTimeout = setTimeout(async () => {
    const method = entry.id ? 'PUT' : 'POST';
    console.log(`updateEntryInDatabase called for index: ${index}, using ${method} method`);
    const url = `${API}/timecards${entry.id ? `/${entry.id}` : ''}`;

    const requestPayload = {
      employee_id: employeeId,
      work_date: entry.date,
      start_time: entry.startTime || null,
      lunch_start: entry.lunchStart || null,
      lunch_end: entry.lunchEnd || null,
      end_time: entry.endTime || null,
      total_time: entry.totalTime || null,
      status: entry.status,
    };

    console.log('Request payload:', requestPayload);


    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to save entry');
      }

      const result = await response.json();
      console.log('Response from server:', result);
      if (method === 'POST' && !entry.id) {
        setTimeCard((prevState) => {
          const updatedEntries = [...prevState.entries];
          updatedEntries[index].id = result.data.id;
          console.log(`New entry created with ID: ${result.data.id}`);
          return { ...prevState, entries: updatedEntries };
        });
      }
      console.log(`Successfully ${method === 'POST' ? 'created' : 'updated'} timecard with ID ${result.data.id}`);
    } catch (error) {
      console.error(`Error during ${method} operation:`, error);
    }
  }, 1000); // Delay by 1 second (1000 ms)
  };

  const handleSubmit = async () => {
    const allSubmitted = timeCard.entries.every((entry) => entry.status === 'submitted');

    if (allSubmitted) {
      alert('This timecard has already been submitted.');
      return;
    }

    if (window.confirm("Are you sure you want to submit? Once submitted, the timecard is locked and cannot be changed.")) {
      try {
        await Promise.all(
          timeCard.entries.map(async (entry) => {
            if (entry.status !== 'submitted') {
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
                  status: 'submitted',
                }),
              });

              if (!response.ok) {
                throw new Error('Failed to submit timecard');
              }
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
    }
  };

  const handleReset = () => {
    const isConfirmed = window.confirm("Are you sure you want to reset? All data entered will be lost.");
    if (!isConfirmed) return;

    setTimeCard({ entries: generateInitialEntries(moment()), isSubmitted: false });
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
    setIsNewTimeCardCreated(false);
    navigate('/createNewTimeCard');
  };

  const handleBack = () => {
    navigate('/createNewTimecard');
  };

  const filteredEntries = timeCard.entries.filter((entry) => isWeekday(entry.date));



  return (
    <div className={`container mt-5 ${styles.container}`}>
      <div className="text-center mb-3">
        <button className="btn btn-primary me-3" onClick={handleSubmit}>Submit</button>
        <button className="btn btn-danger me-3" onClick={handleReset}>Reset</button>
        <button className="btn btn-secondary" onClick={handleBack}>Back to Calendar</button>
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
            {filteredEntries.map((entry, index) => (
              <tr key={entry.date}>
                <td>{moment(entry.date).format('dddd, MMM D, YYYY')}</td>
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


