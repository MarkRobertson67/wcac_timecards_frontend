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
      const adjustedStartDate = getPreviousMonday(startDate);
      const endDate = getEndDate(adjustedStartDate);
      const formattedStart = moment.utc(adjustedStartDate).format('YYYY-MM-DD');
      const formattedEnd = moment.utc(endDate).format('YYYY-MM-DD');
      console.log("Fetching data from", formattedStart, "to", formattedEnd);

      const response = await fetch(`${API}/timecards/employee/${employeeId}/range/${formattedStart}/${formattedEnd}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fetchedData = await response.json();
      console.log("Fetched data:", fetchedData);

      let initialEntries = generateInitialEntries(adjustedStartDate);

      // Merge fetched data with initial entries based on the work_date
      if (fetchedData && Array.isArray(fetchedData.data) && fetchedData.data.length > 0) {
        initialEntries = initialEntries.map((entry) => {
          const foundData = fetchedData.data.find((data) => {
            const entryDate = moment.utc(entry.date).format('YYYY-MM-DD');
            const workDate = moment.utc(data.work_date).format('YYYY-MM-DD');
            return entryDate === workDate;
          });

          const totalTime = foundData && foundData.total_time
            ? `${foundData.total_time.hours}h ${foundData.total_time.minutes}m`
            : '0h 0m';

          return foundData
            ? {
              ...entry,
              id: foundData.id, // Ensure the entry has an ID from the backend
              startTime: foundData.start_time || '',
              lunchStart: foundData.lunch_start || '',
              lunchEnd: foundData.lunch_end || '',
              endTime: foundData.end_time || '',
              totalTime,
              status: foundData.status,
            }
            : entry;
        });
      }

      // Insert missing blank entries after loading existing entries
      const completeEntries = insertMissingEntries(adjustedStartDate, initialEntries);
      setTimeCard({ entries: completeEntries, isSubmitted: false });
      console.log("Updated TimeCard entries with missing blanks filled:", completeEntries);
    } catch (error) {
      console.error('Error fetching timecard data:', error);
      setTimeCard({ entries: generateInitialEntries(startDate), isSubmitted: false });
    }
  };

  // Helper function to insert missing entries for each day in the 2-week period
  const insertMissingEntries = (startDate, entries) => {
    const allEntries = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < 14; i++) {
      const formattedDate = moment.utc(currentDate).format('YYYY-MM-DD');
      const foundEntry = entries.find(entry => entry.date === formattedDate);

      if (foundEntry) {
        allEntries.push(foundEntry);  // Use existing entry if available
      } else if (isWeekday(currentDate)) {
        allEntries.push({
          date: formattedDate,
          startTime: '',
          lunchStart: '',
          lunchEnd: '',
          endTime: '',
          totalTime: '',
          status: 'active',
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return allEntries;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchData();
  }, []);

  const calculateTotalTime = (start, lunchStart, lunchEnd, end) => {

    const parseTime = (time) => (time ? moment(time, 'HH:mm:ss') : null);
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
    return totalTime || '00:00';
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

      updateEntryInDatabase(index, entryToUpdate);
      return { ...prevState, entries };
    });
  };

  const updateEntryInDatabase = async (index, entry) => {
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
        total_time: entry.totalTime ? entry.totalTime : '0h 0m',
        status: entry.status || 'active',
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
    }, 5000);
  };

  const handleSubmit = async () => {
    const twoWeekPeriod = timeCard.entries;

    // Check if all entries are already submitted
    const alreadySubmittedEntries = twoWeekPeriod.every(entry => entry.status === 'submitted');

    if (alreadySubmittedEntries) {
      alert("All entries are already submitted.");
      return;  // Prevent resubmission if everything is already submitted
    }

    // Check if there are any missing entries (no ID) and handle them
    const missingEntries = twoWeekPeriod.filter(entry => !entry.id);

    if (missingEntries.length > 0) {
      console.error(`Some entries are missing IDs:`, missingEntries);
      const confirmation = window.confirm(
        `There are ${missingEntries.length} missing days. Click 'Cancel' to create them first, or 'OK' to ignore blank entries and proceed with the submission.`
      );
      if (!confirmation) return;  // If the user cancels, stop the submission
    }

    // Iterate through all entries and submit them
    await Promise.all(
      twoWeekPeriod.map(async (entry) => {
        // Log the date and ID for each entry in the two-week period
        console.log(`Date: ${entry.date}, ID: ${entry.id ? entry.id : 'No ID assigned yet'}`);

        if (entry.id) {
          // Only submit if the entry has an ID
          const url = `${API}/timecards/${entry.id}`;
          const requestPayload = {
            status: 'submitted',  // Always set status to 'submitted'
          };

          console.log(`Submitting PUT request for date ${entry.date}`);

          try {
            const response = await fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestPayload),
            });

            if (!response.ok) {
              const errorMessage = await response.text();
              console.error(`Failed to submit entry: ${errorMessage}`);
              throw new Error(errorMessage);
            } else {
              console.log(`Successfully updated entry with ID: ${entry.id}`);
            }
          } catch (error) {
            console.error(`Error during PUT operation for date ${entry.date}:`, error);
          }
        }
      })
    );

    // After submitting, reset the timecard
    console.log('Timecard submitted successfully');
    setIsNewTimeCardCreated(false);
    afterSubmitReset();
    navigate('/');
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


  const afterSubmitReset = () => {
    setTimeCard({ entries: generateInitialEntries(moment()), isSubmitted: false });
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
    setIsNewTimeCardCreated(false);
  }


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


