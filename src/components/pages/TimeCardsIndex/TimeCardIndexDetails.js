// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.



import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { formatDate, formatTime } from "../utils/TimeAndDateUtils";
import styles from "./TimeCardIndexDetails.css";

const API = process.env.REACT_APP_API_URL;

function TimeCardDetails() {
  const { date } = useParams();
  const location = useLocation();
  const employeeId = location.state?.employeeId;
  const [timeEntries, setTimeEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Component mounted. Date:", date, "Employee ID:", employeeId);

    if (!employeeId) {
      console.error("Employee ID is missing.");
      return;
    }

    const fetchTimeEntries = async () => {
      console.log(
        `Fetching time entries for Employee ID: ${employeeId}, Date: ${date}`
      );

      try {
        setIsLoading(true);

        const response = await fetch(
          `${API}/reports/detailed/${employeeId}?startDate=${date}&endDate=${date}`
        );

        if (response.ok) {
          const result = await response.json();
          console.log("Fetched time entries result:", result);
          setTimeEntries(result);
        } else {
          console.error(
            `Failed to fetch detailed timecards. Status: ${response.status}`
          );
          const errorText = await response.text();
          console.error("Error response text:", errorText);
        }
      } catch (error) {
        console.error("Error fetching detailed timecards:", error);
      } finally {
        setIsLoading(false);
        console.log("Fetch process completed.");
      }
    };

    fetchTimeEntries();
  }, [employeeId, date]);

  const calculateTotalTime = (totalHours) => {
    if (!totalHours) return "0 Hours 0 Minutes";
    const { hours, minutes } = totalHours;
    return `${hours} h ${minutes} m`;
  };

  const renderTable = (entries, type) => {
    if (!entries.length) return <p>No {type} time entries found.</p>;

    return (
      <div className={`table-responsive ${styles["table-container"]}`}>
        <table className="table table-bordered table-striped">
          <thead className="thead-dark">
            <tr>
              <th>Start Time</th>
              <th>Lunch Start</th>
              <th>Lunch End</th>
              <th>End Time</th>
              <th>Total Time</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index}>
                <td>{formatTime(entry.start_time) || "N/A"}</td>
                <td>{formatTime(entry.lunch_start) || "N/A"}</td>
                <td>{formatTime(entry.lunch_end) || "N/A"}</td>
                <td>{formatTime(entry.end_time) || "N/A"}</td>
                <td>{calculateTotalTime(entry.total_hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };


  const drivingEntries = timeEntries
  .filter((entry) => entry.driving_total_hours && (entry.driving_total_hours.hours > 0 || entry.driving_total_hours.minutes > 0))
  .map((entry) => ({
    start_time: entry.driving_start_time,
    lunch_start: entry.driving_lunch_start,
    lunch_end: entry.driving_lunch_end,
    end_time: entry.driving_end_time,
    total_hours: entry.driving_total_hours,
  }));

const facilityEntries = timeEntries
.filter((entry) => entry.facility_total_hours && (entry.facility_total_hours.hours > 0 || entry.facility_total_hours.minutes > 0))
  .map((entry) => ({
    start_time: entry.facility_start_time,
    lunch_start: entry.facility_lunch_start,
    lunch_end: entry.facility_lunch_end,
    end_time: entry.facility_end_time,
    total_hours: entry.facility_total_hours,
  }));


  return (
    <div className={`container mt-5 ${styles["timecard-details"]}`}>
      <h2 className="text-center mb-4">{`Time Entries for ${formatDate(
        date
      )}`}</h2>
      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="mt-2">Loading time entries...</div>
        </div>
      ) : (
        <>
          {drivingEntries.length > 0 && (
            <>
              <h3 className="text-center">Driving</h3>
              {renderTable(drivingEntries, "Driving")}
            </>
          )}

          {facilityEntries.length > 0 && (
            <>
              <h3 className="text-center">Facility</h3>
              {renderTable(facilityEntries, "Facility")}
            </>
          )}

          {drivingEntries.length === 0 && facilityEntries.length === 0 && (
            <p className="text-center">No time entries found for this date.</p>
          )}
        </>
      )}

      <div className="text-center mt-3">
        <button
          className="btn btn-primary"
          onClick={() => {
            console.log("Back button clicked. Returning to calendar.");
            window.history.back();
          }}
        >
          Back to Calendar
        </button>
      </div>
    </div>
  );
}

export default TimeCardDetails;
