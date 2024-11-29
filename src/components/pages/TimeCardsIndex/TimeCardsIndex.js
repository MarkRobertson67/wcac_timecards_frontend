// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction"; // Needed for dateClick
import styles from './TimeCardsIndex.module.css';
import { auth } from "../../../firebase/firebaseConfig";

const API = process.env.REACT_APP_API_URL;

function TimeCardsIndex() {
  const [timeEntries, setTimeEntries] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(true);
  const [isTimecardsLoading, setIsTimecardsLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployeeId = async () => {
      try {
        const user = auth.currentUser; // Get the currently logged-in user
        if (user) {
          const response = await fetch(`${API}/employees/firebase/${user.uid}`);
          if (response.ok) {
            const { data } = await response.json();
            setEmployeeId((prevId) => {
              if (prevId !== data.id) {
                return data.id; // Only update if the value changes
              }
              return prevId;
            });
          } else {
            console.error("Failed to fetch employee ID.");
          }
        }
      } catch (error) {
        console.error("Error fetching employee ID:", error);
      }
    };

    fetchEmployeeId();
  }, []);

  useEffect(() => {
    if (!employeeId) return;

    const fetchEmployeeData = async () => {
      try {
        setIsEmployeeLoading(true);
        const employeeResponse = await fetch(`${API}/employees/${employeeId}`);
        const employeeData = await employeeResponse.json();
        console.log("Fetched employee data:", employeeData);
        setEmployee(employeeData.data);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setIsEmployeeLoading(false);
      }
    };

    const fetchTimecardEntries = async () => {
      try {
        setIsTimecardsLoading(true);
        const timecardsResponse = await fetch(
          `${API}/timecards/employee/${employeeId}`
        );
        const timecardsData = await timecardsResponse.json();
        console.log("Fetched timecards data:", timecardsData);
        setTimeEntries(timecardsData.data);
      } catch (error) {
        console.error("Error fetching timecards data:", error);
      } finally {
        setIsTimecardsLoading(false);
      }
    };

    fetchEmployeeData();
    fetchTimecardEntries();
  }, [employeeId]);

  const isLoading = isEmployeeLoading || isTimecardsLoading;

  const isMobile = () => {
    return window.innerWidth <= 768; // You can adjust the breakpoint as per your requirements
  };

  const formatTotalTime = (interval) => {
    if (!interval) {
      return isMobile() ? "0:00" : "0h 0m"; // Default values for mobile and desktop
    }

    const { hours, minutes } = interval;

    if (isMobile()) {
      // Mobile: Format as "5:30"
      const formattedHours = hours || 0;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes; // Add leading zero for single-digit minutes
      return `${formattedHours}:${formattedMinutes}`;
    } else {
      // Desktop: Format as "5h 30m"
      return `${hours || 0}h ${minutes || 0}m`;
    }
  };

  // const handleDateClick = (info) => {
  //   const calendarApi = info.view.calendar;
  //   calendarApi.changeView('dayGridDay', info.dateStr);
  // };

  const handleDateClick = (info) => {
    navigate(`/timeCardDetails/${info.dateStr}`, {
      state: { employeeId }, // Pass employeeId
    });
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div
        className={styles.eventContent}
        onClick={() =>
          handleDateClick({
            view: eventInfo.view,
            dateStr: eventInfo.event.startStr,
          })
        }
      >
        <span>{eventInfo.event.extendedProps.time}</span>
      </div>
    );
  };

  const events = timeEntries.flatMap((entry) => {
    // Create a Date object from work_date
    const workDate = new Date(entry.work_date); // This should already be in UTC
    console.log("Processing workDate:", workDate); // Log the processed workDate

    const eventStart = workDate.toISOString(); // Convert to ISO string for UTC
    console.log("Event Start:", eventStart); // Log the event start time

    const eventsForDay = [];

    // Facility work event
    if (
      entry.facility_total_hours &&
      (entry.facility_total_hours.hours > 0 ||
        entry.facility_total_hours.minutes > 0)
    ) {
      eventsForDay.push({
        title: "Facility Work",
        start: eventStart,
        end: eventStart,
        extendedProps: {
          time: `F: ${formatTotalTime(entry.facility_total_hours)}`,
        },
      });
    }

    // Driving work event
    if (
      entry.driving_total_hours &&
      (entry.driving_total_hours.hours > 0 ||
        entry.driving_total_hours.minutes > 0)
    ) {
      eventsForDay.push({
        title: "Driving Work",
        start: eventStart,
        end: eventStart,
        extendedProps: {
          time: `D: ${formatTotalTime(entry.driving_total_hours)}`,
        },
      });
    }

    return eventsForDay;
  });

  console.log("Generated events:", events); // Log the generated events

  return (
    <div className={styles.container}>
      <h2>
        Total Hours Worked for{" "}
        {employee ? `${employee.first_name} ${employee.last_name}` : "..."}
      </h2>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border custom-spinner" role="status"></div>
          <div className="mt-2">Loading timecard data...</div>
        </div>
      ) : (
        <FullCalendar
          timeZone="UTC"
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={new Date().toISOString()} // Force UTC
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridDay",
          }}
          events={events} // Pass the logged events to FullCalendar
          eventContent={renderEventContent}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // 24-hour format for consistency
            timeZone: "UTC",
          }}
          dateClick={handleDateClick}
          height="auto" // height of calendar
        />
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <span>Key:</span>
        <span>D = Driving</span>
        <span>F = Facility</span>
      </div>
    </div>
  );
}

export default TimeCardsIndex;
