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

  // const isMobile = () => {
  //   return window.innerWidth <= 768; // You can adjust the breakpoint as per your requirements
  // };

  const formatTotalTime = (interval) => {
    if (!interval) {
      return "0h 0m"; // Default for both mobile and desktop
    }
  
    const { hours, minutes } = interval;
  
    // Use the same format for both mobile and desktop
    return `${hours || 0}h ${minutes || 0}m`; // Always return "5h 30m" or "5h 0m"
  };
  

  const adjustTodayDate = (hoursToSubtract) => {
    const adjustedDate = new Date();
    adjustedDate.setHours(adjustedDate.getHours() - hoursToSubtract); // Subtract 4 hours
    return adjustedDate.toISOString(); // Return in ISO string format
  };

  
  const handleDateClick = (info) => {
    navigate(`/timeCardIndexDetails/${info.dateStr}`, {
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
      (entry.facility_total_hours.hours >= 0 || entry.facility_total_hours.minutes >= 0) // Check for valid hours or minutes
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
      (entry.driving_total_hours.hours >= 0 || entry.driving_total_hours.minutes >= 0) // Check for valid hours or minutes
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
        Total Hours Worked Each Day<br></br> For{" "}
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
          initialDate={new Date(Date.UTC(
            new Date().getUTCFullYear(),
            new Date().getUTCMonth(),
            new Date().getUTCDate()
          )).toISOString()} // Force UTC for the calendar's initial date
          now={new Date().toISOString()} // Set FullCalendar's "now" to UTC date and time
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridDay",
          }}
          events={events}
          eventContent={renderEventContent}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: "UTC",
          }}
          dateClick={handleDateClick}
  height="auto"
  buttonText={{
    today: 'Today' // Override button label to ensure it's correctly displayed
  }}
  // Adjust 'today' button functionality
  customButtons={{
    today: {
      text: 'Today',
      click: function() {
        // Use the adjusted "today" date
        const todayDate = adjustTodayDate(4); // Subtract 4 hours for the "today" button
        this.gotoDate(todayDate); // Go to the adjusted "today" date
      }
    }
  }}
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
