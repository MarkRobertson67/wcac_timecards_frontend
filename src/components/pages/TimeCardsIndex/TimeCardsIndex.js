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
  const [employee, setEmployee] = useState(null);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(true);
  const [isTimecardsLoading, setIsTimecardsLoading] = useState(true);
  const employeeId = 2;  // currentUser?.employeeId; Replace with actual employee ID from FireBase authentication



  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsEmployeeLoading(true);
        const employeeResponse = await fetch(`${API}/employees/${employeeId}`);
        const employeeData = await employeeResponse.json();
        console.log('Fetched employee data:', employeeData);
        setEmployee(employeeData.data);
      } catch (error) {
        console.error('Error fetching employee data:', error);
      } finally {
        setIsEmployeeLoading(false);
      }
    };

    const fetchTimecardEntries = async () => {
      try {
        setIsTimecardsLoading(true);
        const timecardsResponse = await fetch(`${API}/timecards/employee/${employeeId}`);
        const timecardsData = await timecardsResponse.json();
        console.log('Fetched timecards data:', timecardsData);
        setTimeEntries(timecardsData.data);
      } catch (error) {
        console.error('Error fetching timecards data:', error);
      } finally {
        setIsTimecardsLoading(false);
      }
    };

    fetchEmployeeData();
    fetchTimecardEntries();
  }, []);

  const isLoading = isEmployeeLoading || isTimecardsLoading;



  const formatTotalTime = (interval) => {
    if (!interval) {
      return;
    }

    const { hours, minutes } = interval;
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

  const events = timeEntries.flatMap((entry) => {
    // Create a Date object from work_date
    const workDate = new Date(entry.work_date); // This should already be in UTC
    console.log('Processing workDate:', workDate); // Log the processed workDate

    const eventStart = workDate.toISOString(); // Convert to ISO string for UTC
    console.log('Event Start:', eventStart); // Log the event start time

    const eventsForDay = [];

    // Facility work event
    if (entry.facility_total_hours) {
      eventsForDay.push({
        title: 'Facility Work',
        start: eventStart,
        end: eventStart,
        extendedProps: {
          time: `Facility: ${formatTotalTime(entry.facility_total_hours)}`,
        },
      });
    }

    // Driving work event
    if (entry.driving_total_hours) {
      eventsForDay.push({
        title: 'Driving Work',
        start: eventStart,
        end: eventStart,
        extendedProps: {
          time: `Driving: ${formatTotalTime(entry.driving_total_hours)}`,
        },
      });
    }

    return eventsForDay;
  });

  console.log('Generated events:', events); // Log the generated events

  return (
    <div className={styles.container}>
      <h2>Total Hours Worked for {employee ? `${employee.first_name} ${employee.last_name}` : '...'}</h2>


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

