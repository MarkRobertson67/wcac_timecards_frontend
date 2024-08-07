// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import styles from './ActiveTimeCard.module.css';
// import { format } from 'date-fns';

const API = process.env.REACT_APP_API_URL;

function ActiveTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const [startDate, setStartDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const navigate = useNavigate();

  const employeeId = 1; // Replace with actual employee ID when Firebase added

  useEffect(() => {
    const savedTimeCard = JSON.parse(localStorage.getItem('currentTimeCard'));
    const storedStartDate = localStorage.getItem('startDate');

    if (savedTimeCard && storedStartDate) {
      setTimeCard(savedTimeCard);
      setStartDate(new Date(storedStartDate));
    } else if (storedStartDate) {
      const initialEntries = generateInitialEntries(new Date(storedStartDate));
      setTimeCard({ entries: initialEntries, isSubmitted: false });
      localStorage.setItem('currentTimeCard', JSON.stringify({ entries: initialEntries, isSubmitted: false }));
    }
  }, []);

  // Function to get the previous Monday from a given date
  const getPreviousMonday = (date) => {
    const day = date.getDay();
    console.log('Current date:', date.toDateString()); // Log the current date
    console.log('Current day (0 = Sunday, 6 = Saturday):', day); // Log the current day of the week

    // Calculate how many days to subtract to get to the previous Monday
    const daysToSubtract = (day === 0 ? 6 : day - 1);
    console.log('Days to subtract:', daysToSubtract); // Log the number of days to subtract

    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToSubtract);
    console.log('Calculated Monday:', monday.toDateString()); // Log the resulting Monday date

    return monday;
  };
  console.log('hello')

  const generateInitialEntries = (startDate) => {
    const entries = [];
    let currentDate = new Date(startDate);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + 13); // Two weeks from the start date

    while (currentDate <= endDate) {
      entries.push({
        date: currentDate.toISOString().split('T')[0], // Format date as ISO string
        startTime: '',
        lunchStart: '',
        lunchEnd: '',
        endTime: '',
        totalTime: ''
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return entries;
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

  const handleDateChange = (date) => {
    console.log('Date selected from calendar:', date.toDateString()); // Log the date selected from calendar
    const previousMonday = getPreviousMonday(date);
    console.log('Previous Monday calculated:', previousMonday.toDateString()); // Log the calculated previous Monday
    setStartDate(previousMonday);
    setShowCalendar(false);
    const initialEntries = generateInitialEntries(previousMonday);
    setTimeCard({ entries: initialEntries, isSubmitted: false });
    localStorage.setItem('currentTimeCard', JSON.stringify({ entries: initialEntries, isSubmitted: false }));
    localStorage.setItem('startDate', previousMonday.toISOString());
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

    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isWeekday = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
  };

  const filteredEntries = timeCard.entries.filter(entry => isWeekday(entry.date));

  return (
    <div className={`container mt-5 ${styles.container}`}>
      <div className="text-center mb-3">
        <button className="btn btn-primary me-3" onClick={handleSubmit}>Submit</button>
        <button className="btn btn-secondary" onClick={handleReset}>Reset</button>
      </div>
      <h2 className="text-center mb-4">Active Timecard</h2>
      <div className="text-center mb-4">
        {showCalendar && (
          <Calendar
            onChange={handleDateChange}
            value={startDate}
          />
        )}
      </div>
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
