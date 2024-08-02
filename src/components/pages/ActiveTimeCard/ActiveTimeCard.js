// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ActiveTimeCard.module.css';
import { startOfWeek } from 'date-fns';

const API = process.env.REACT_APP_API_URL;

function ActiveTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const navigate = useNavigate();
  const employeeId = 1; // Replace with actual employee ID when Firebase added
  

  useEffect(() => {
    const savedTimeCard = JSON.parse(localStorage.getItem('currentTimeCard'));
    const startDate = localStorage.getItem('startDate');
    if (savedTimeCard && startDate) {
      setTimeCard(savedTimeCard);
    } else if (startDate) {
      const start = new Date(startDate);
      const endDate = new Date(start);
      endDate.setDate(endDate.getDate() + 13);

      const initialEntries = [];
      let currentDate = startOfWeek(new Date(start), { weekStartsOn: 0 });
      while (currentDate <= endDate) {
        initialEntries.push({
          date: currentDate.toISOString().slice(0, 10),
          startTime: '',
          lunchStart: '',
          lunchEnd: '',
          endTime: '',
          totalTime: ''
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setTimeCard({ entries: initialEntries, isSubmitted: false });
      localStorage.setItem('currentTimeCard', JSON.stringify({ entries: initialEntries, isSubmitted: false }));
    }
  }, []);

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

    if (entry.startTime && !entry.id) {
      console.log('Posting timecard entry...');
      try {
        const response = await fetch(`${API}/timecards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to save timecard entry: ${errorData.error}`);
        }

        const result = await response.json();
        console.log('Timecard entry saved successfully:', result);
      } catch (error) {
        console.error('Error saving timecard entry:', error.message);
      }
    }

    if (entry.totalTime !== '0h 0m' && entry.id) {
      console.log('Updating timecard entry...');
      try {
        const response = await fetch(`${API}/timecards/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update timecard entry: ${errorData.error}`);
        }

        const result = await response.json();
        console.log('Timecard entry updated successfully:', result);
      } catch (error) {
        console.error('Error updating timecard entry:', error.message);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      await Promise.all(
        timeCard.entries.map(async (entry) => {
          const response = await fetch(`${API}/timecards${entry.id ? `/${entry.id}` : ''}`, {
            method: entry.id ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
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

  const calculateTotalTime = (start, lunchStart, lunchEnd, end) => {
    const parseTime = (time) => time ? new Date(`1970-01-01T${time}:00`) : null;
  
    const startTime = parseTime(start);
    const lunchStartTime = parseTime(lunchStart);
    const lunchEndTime = parseTime(lunchEnd);
    const endTime = parseTime(end);
  
    let totalMinutes = 0;
  
    if (startTime && lunchStartTime) {
      const morningWork = (lunchStartTime - startTime) / (1000 * 60);
      totalMinutes += morningWork;
    }
  
    if (lunchEndTime && endTime) {
      const afternoonWork = (endTime - lunchEndTime) / (1000 * 60);
      totalMinutes += afternoonWork;
    }
  
    if (startTime && endTime && !lunchStartTime && !lunchEndTime) {
      const allDayWork = (endTime - startTime) / (1000 * 60);
      totalMinutes = allDayWork;
    }
  
    if (startTime && lunchStartTime && lunchEndTime && !endTime) {
      const morningWork = (lunchStartTime - startTime) / (1000 * 60);
      totalMinutes = morningWork;
    }
  
    totalMinutes = Math.max(totalMinutes, 0);
  
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
  
    // Format hours and minutes to always show two digits
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
  
    return `${formattedHours}h ${formattedMinutes}m`;
  };
  

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={`container mt-5 ${styles.container}`}>
      <div className="text-center">
        <button className="btn btn-primary me-3" onClick={handleSubmit}>Submit</button>
        <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
      </div>
      <h2 className="text-center my-4">Active Timecard</h2>
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
            {timeCard.entries.map((entry, index) => (
              <tr key={index}>
                <td>{formatDate(entry.date)}</td>
                <td>
                  <input
                    type="time"
                    className={`form-control ${styles.input}`}
                    value={entry.startTime}
                    onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className={`form-control ${styles.input}`}
                    value={entry.lunchStart}
                    onChange={(e) => handleChange(index, 'lunchStart', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className={`form-control ${styles.input}`}
                    value={entry.lunchEnd}
                    onChange={(e) => handleChange(index, 'lunchEnd', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className={`form-control ${styles.input}`}
                    value={entry.endTime}
                    onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                  />
                </td>
                <td>
                  <div className={`form-control ${styles.input} ${styles.totalTime}`}>
                    {entry.totalTime}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActiveTimeCard;

