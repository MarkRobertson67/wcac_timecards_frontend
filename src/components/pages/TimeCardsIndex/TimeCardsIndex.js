// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // Needed for dateClick
import styles from './TimeCardsIndex.module.css';

const API = process.env.REACT_APP_API_URL;

function TimeCardsIndex() {
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const employeeId = 1;  // currentUser?.employeeId; Replace with actual employee ID from FireBase authentication
  // const timeoutRef = useRef(null); // Ref to keep track of the inactivity timer

  // useEffect(() => {
  //   // Function to reset the inactivity timer
  //   const resetInactivityTimer = () => {
  //     clearTimeout(timeoutRef.current); // Clear existing timer if any
  //     timeoutRef.current = setTimeout(() => {
  //       // Reload page after 5 minutes of inactivity
  //       console.log("Inactivity detected, reloading page...");
  //       window.location.reload();
  //     }, 5 * 60 * 1000); // 5 minutes in milliseconds
  //   };

  //   // Set up event listeners to detect user activity
  //   const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
  //   events.forEach(event => window.addEventListener(event, resetInactivityTimer));

  //   // Initial timer setup
  //   resetInactivityTimer();

  //   // Cleanup event listeners on unmount
  //   return () => {
  //     events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
  //     clearTimeout(timeoutRef.current); // Clear timer when component unmounts
  //   };
  // }, []);



  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        setIsLoading(true); // Set loading state to true before fetching
        const response = await fetch(`${API}/timecards/employee/${employeeId}`);
        const data = await response.json();
        console.log('Fetched data:', data);
        setTimeEntries(data.data);
      } catch (error) {
        console.error('Error fetching time entries:', error);
      } finally {
        setIsLoading(false); // Set loading state to false after fetching completes
      }
    };

    fetchTimeEntries();
  }, []);

  const formatTotalTime = (totalTime) => {
    if (!totalTime) {
      return;
    }

    const { hours, minutes } = totalTime;
    return `${hours || 0}h ${minutes || 0}m`;
  };

  const handleDateClick = (info) => {
    const calendarApi = info.view.calendar;
    calendarApi.changeView('dayGridDay', info.dateStr);
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div
        className={styles.eventContent}
        onClick={() => handleDateClick({ view: eventInfo.view, dateStr: eventInfo.event.startStr })}
      >
        <span>{eventInfo.event.extendedProps.time}</span>
      </div>
    );
  };

  const events = timeEntries.map((entry) => {
    // Create a Date object from work_date
    const workDate = new Date(entry.work_date); // This should already be in UTC
    console.log('Processing workDate:', workDate); // Log the processed workDate

    const eventStart = workDate.toISOString(); // Convert to ISO string for UTC
    console.log('Event Start:', eventStart); // Log the event start time

    return {
      title: '',
      start: eventStart,   // Same for start
      end: eventStart,     // Same for end
      extendedProps: {
        time: formatTotalTime(entry.total_time),
      },
    };
  });

  console.log('Generated events:', events); // Log the generated events

  return (
    <div className={styles.container}>
      <h2>Total Hours Worked</h2>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border custom-spinner" role="status">
          </div>
          <div className="mt-2">Loading timecard data...</div>
        </div>
      ) : (

        <FullCalendar
          timeZone="UTC"
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={new Date()}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridDay'
          }}
          events={events} // Pass the logged events to FullCalendar
          eventContent={renderEventContent}
          dateClick={handleDateClick}
          height="auto" // height of calendar
        />
      )}

    </div>
  );
}

export default TimeCardsIndex;

