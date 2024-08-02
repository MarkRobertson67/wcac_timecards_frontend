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

  useEffect(() => {
    const fetchTimeEntries = async () => {
      try {
        const response = await fetch(`${API}/timecards/employee/1`);
        const data = await response.json();
        console.log('Fetched data:', data); // Debug: log the fetched data
        setTimeEntries(data.data); 
      } catch (error) {
        console.error('Error fetching time entries:', error);
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

  return (
    <div className={styles.container}>
      <h2>Total Hours Worked</h2>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={new Date()}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridDay'
        }}
        events={timeEntries.map((entry) => ({
          title: '', 
          start: entry.work_date,
          end: entry.work_date,
          extendedProps: {
            time: formatTotalTime(entry.total_time),
          },
        }))}
        eventContent={renderEventContent} 
        dateClick={handleDateClick} 
        height="auto" // height of calendar
      />
    </div>
  );
}

export default TimeCardsIndex;
