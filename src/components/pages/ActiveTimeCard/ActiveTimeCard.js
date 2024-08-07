// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap is included
import styles from './ActiveTimeCard.module.css';
import { startOfWeek, addDays, format } from 'date-fns';

const API = process.env.REACT_APP_API_URL;

function ActiveTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const navigate = useNavigate();
  const employeeId = 1; // Replace with actual employee ID when Firebase added

  // Utility Functions
  const getPreviousMonday = (date) => {
    if (date.getDay() === 0) { // If Sunday
      return addDays(date, 1); // Next Monday
    }
    return startOfWeek(date, { weekStartsOn: 1 }); // Current week's Monday
  };

  const generateInitialEntries = useCallback((startDate) => {
    const entries = [];
    let currentDate = getPreviousMonday(startDate);
    const endDate = addDays(currentDate, 13); // Two weeks from the start date

    while (currentDate <= endDate) {
      entries.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        startTime: '',
        lunchStart: '',
        lunchEnd: '',
        endTime: '',
        totalTime: ''
      });
      currentDate = addDays(currentDate, 1);
    }

    return entries;
  }, []);

  useEffect(() => {
    const savedTimeCard = JSON.parse(localStorage.getItem('currentTimeCard'));
    const storedStartDate = localStorage.getItem('startDate');

    if (savedTimeCard && storedStartDate) {
      setTimeCard(savedTimeCard);
      // The startDate state is no longer used, so this is removed
    } else if (storedStartDate) {
      const initialEntries = generateInitialEntries(new Date(storedStartDate));
      setTimeCard({ entries: initialEntries, isSubmitted: false });
      localStorage.setItem('currentTimeCard', JSON.stringify({ entries: initialEntries, isSubmitted: false }));
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

    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => format(new Date(dateString), 'eeee, MMM d, yyyy');

  const isWeekday = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
  };

  const handleChange = async (index, field, value) => {
    const updatedEntries = [...timeCard.entries];
    updatedEntries[index][field] = value;
    updatedEntries[index].totalTime = calculateTotalTime(
      updatedEntries[index].startTime,
      updatedEntries[index].lunchStart,
      updatedEntries[index].lunchEnd,
      updatedEntries[index].endTime
    );
    setTimeCard({ ...timeCard, entries: updatedEntries });

    const entry = updatedEntries[index];
    const requestPayload = {
      employee_id: employeeId,
      work_date: entry.date,
      start_time: entry.startTime,
      lunch_start: entry.lunchStart,
      lunch_end: entry.lunchEnd,
      end_time: entry.endTime,
      total_time: entry.totalTime,
    };

    if (!entry.startTime || !entry.endTime || !entry.date) {
      console.error('Missing required fields:', requestPayload);
      return;
    }

    try {
      const response = await fetch(`${API}/timecards${entry.id ? `/${entry.id}` : ''}`, {
        method: entry.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to ${entry.id ? 'update' : 'save'} timecard entry: ${errorData.error}`);
      }

      const result = await response.json();
      console.log(`Timecard entry ${entry.id ? 'updated' : 'saved'} successfully:`, result);
    } catch (error) {
      console.error(`Error ${entry.id ? 'updating' : 'saving'} timecard entry:`, error.message);
    }
  };

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
