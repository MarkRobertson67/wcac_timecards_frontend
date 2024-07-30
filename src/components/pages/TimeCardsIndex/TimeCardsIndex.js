// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // Needed for dateClick
//import './TimeCardsIndex.css'; // Import CSS file

const API = process.env.REACT_APP_API_URL;

function TimeCardsIndex() {
  const [timeEntries, setTimeEntries] = useState([]);

  useEffect(() => {
    // Fetch time cards from the backend
    const fetchTimeEntries = async () => {
      try {
        const response = await fetch(`${API}/timecards/employee/1`);
        const data = await response.json();
        console.log('Fetched data:', data); // Debug: log the fetched data
        setTimeEntries(data.data); // Assuming the response structure has a 'data' field
      } catch (error) {
        console.error('Error fetching time entries:', error);
      }
    };

    fetchTimeEntries();
  }, []);

  const formatTotalTime = ({ hours, minutes }) => {
    return `${hours}h ${minutes}m`;
  };

  const handleDateClick = (info) => {
    const calendarApi = info.view.calendar;
    calendarApi.changeView('dayGridDay', info.dateStr);
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div
        className="event-content"
        onClick={() => handleDateClick({ view: eventInfo.view, dateStr: eventInfo.event.startStr })}
      >
        <span>{eventInfo.event.extendedProps.time}</span>
      </div>
    );
  };

  return (
    <div className="container">
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
          title: '', // No title
          start: entry.work_date,
          end: entry.work_date,
          extendedProps: {
            time: formatTotalTime(entry.total_time),
          },
        }))}
        eventContent={renderEventContent} // Custom event rendering
        dateClick={handleDateClick} // Handle date clicks
        height="auto" // Adjust the height of the calendar
      />
    </div>
  );
}

export default TimeCardsIndex;

