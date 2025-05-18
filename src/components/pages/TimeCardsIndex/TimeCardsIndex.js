// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction"; // Needed for dateClick
import styles from "./TimeCardsIndex.module.css";
import { auth } from "../../../firebase/firebaseConfig";

const API = process.env.REACT_APP_API_URL;

function TimeCardsIndex() {
  const [timeEntries, setTimeEntries] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(true);
  const [isTimecardsLoading, setIsTimecardsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Track screen size

  const navigate = useNavigate();

  // Track screen size for responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const formatTotalTime = (interval) => {
    if (!interval) {
      return "0h 0m";
    }

    const { hours, minutes } = interval;
    return `${hours || 0}h ${minutes || 0}m`;
  };

  const handleDateClick = (info) => {
    navigate(`/timeCardIndexDetails/${info.dateStr}`, {
      state: { employeeId },
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
    const workDate = new Date(entry.work_date);
    const eventStart = workDate.toISOString();

    const eventsForDay = [];

    // Facility work event
    if (
      entry.facility_total_hours &&
      (entry.facility_total_hours.hours >= 0 ||
        entry.facility_total_hours.minutes >= 0)
    ) {
      eventsForDay.push({
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
      (entry.driving_total_hours.hours >= 0 ||
        entry.driving_total_hours.minutes >= 0)
    ) {
      eventsForDay.push({
        start: eventStart,
        end: eventStart,
        extendedProps: {
          time: `D: ${formatTotalTime(entry.driving_total_hours)}`,
        },
      });
    }

    return eventsForDay;
  });

  return (
    <div
      className={styles.container}
      style={{
        width: "100%",
        maxHeight: isMobile ? "calc(100vh - 150px)" : "80%",
        overflowY: isMobile ? "auto" : "hidden",
        paddingBottom: isMobile ? "100px" : "0px",
      }}
    >
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
        <div className={styles.calendarWrapper}>
        <FullCalendar
          timeZone="UTC"
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={new Date(
            Date.UTC(
              new Date().getUTCFullYear(),
              new Date().getUTCMonth(),
              new Date().getUTCDate()
            )
          ).toISOString()}
          now={new Date().toISOString()}
          headerToolbar={{
            left: isMobile ? "prev,next" : "prev,next today", // Hide 'today' button on mobile
            center: "title",
            right: "dayGridMonth,dayGridDay",
          }}
          events={events}
          eventContent={renderEventContent}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "UTC",
          }}
          dateClick={handleDateClick}
          height="auto"
          style={{
            maxHeight: isMobile ? "calc(100vh - 180px)" : "100%", // Adjust for mobile screens
            overflowY: isMobile ? "auto" : "hidden", // Allow scrolling on mobile only
            paddingBottom: isMobile ? "80px" : "0px", // Add extra space on mobile
          }}
        />
        </div>
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
