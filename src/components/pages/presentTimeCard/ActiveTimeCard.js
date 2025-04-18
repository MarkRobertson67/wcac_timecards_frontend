// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase/firebaseConfig";
import styles from "./ActiveTimeCard.module.css";
import moment from "moment-timezone";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import mySound from "../../../Assets/mySound.wav";

const API = process.env.REACT_APP_API_URL;

function ActiveTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false); // Initialize the flag
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [defaultActivity] = useState("Facility");
  const [employeeId, setEmployeeId] = useState(null);
  const [validationMessages, setValidationMessages] = useState({});
  const [startDateAdjusted, setStartDateAdjusted] = useState(false);
  const navigate = useNavigate();

  // Get window size for Confetti
  const { width, height } = useWindowSize();
  //console.log('Window Size:', width, height);

  // Check if the screen width is mobile (adjust as needed for your breakpoint)
  //const isMobile = width <= 768;

  useEffect(() => {
    const fetchEmployeeId = async () => {
      try {
        const user = auth.currentUser; // Get current logged-in user
        if (user) {
          const response = await fetch(`${API}/employees/firebase/${user.uid}`);
          if (response.ok) {
            const { data } = await response.json();
            setEmployeeId((prevId) => {
              if (prevId !== data.id) {
                return data.id; // Only update if it's different
              }
              return prevId; // No re-render if unchanged
            });
          } else {
            console.error("Failed to fetch employee details.");
          }
        } else {
          console.error("No authenticated user found.");
        }
      } catch (error) {
        console.error("Error fetching employee ID:", error);
      }
    };

    fetchEmployeeId();
  }, []);

  const [entryToUpdate, setEntryToUpdate] = useState(null);

  const getPreviousMonday = (date) => {
    const utcDate = moment.utc(date); // Convert the input date to UTC
    const day = utcDate.day();

    // Get the last Monday based on the existing logic
    let lastMonday;
    if (day === 1) {
      // If the day is Monday (1)
      lastMonday = utcDate; // Return the same date in UTC
    } else if (day === 0) {
      // If the day is Sunday (0)
      lastMonday = utcDate.add(1, "days"); // Move to Monday
    } else {
      lastMonday = utcDate.startOf("week").add(1, "days"); // Start of the week is Sunday, get Monday
    }

    // Now adjust this Monday based on the 2-week schedule starting from the reference date
    const referenceDate = moment.utc("1970-01-05"); // Reference date
    const daysDifference = lastMonday.diff(referenceDate, "days");
    const twoWeekPeriods = Math.floor(daysDifference / 14);
    const adjustedMonday = referenceDate
      .clone()
      .add(twoWeekPeriods * 14, "days");

    // Return the adjusted Monday
    return adjustedMonday;
  };

  const getEndDate = (startDate) => {
    return moment(startDate).add(13, "days"); // Two-week period
  };

  const formatTime = (time) => {
    if (!time) return ""; // Fallback for null or undefined values
    const parsedTime = moment(time, "HH:mm:ss");
    return parsedTime.isValid() ? parsedTime.format("HH:mm") : "";
  };

  const fetchTimeCardData = useCallback(
    async (startDate) => {
      try {
        // Set loading state
        setIsLoading(true);
        console.log("Fetching timecard data for employee:", employeeId);
        console.log("Start date:", startDate);

        // const timestamp = new Date().toLocaleString(); // Get the current timestamp
        // console.log(
        //   `[${timestamp}] Fetching timecard data... likely due to page reload from inactivity`
        // );

        const adjustedStartDate = getPreviousMonday(startDate);
        const endDate = getEndDate(adjustedStartDate);

        // Format dates
        const formattedStart = moment
          .utc(adjustedStartDate)
          .format("YYYY-MM-DD");
        const formattedEnd = moment.utc(endDate).format("YYYY-MM-DD");

        console.log(
          `Fetching timecard data from ${formattedStart} to ${formattedEnd}`
        );

        // Fetch existing timecards from the backend
        const response = await fetch(
          `${API}/timecards/employee/${employeeId}/range/${formattedStart}/${formattedEnd}?timestamp=${Date.now()}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const fetchedData = await response.json();
        console.log("Fetched Data:", fetchedData);

        // Create a map for the fetched entries
        const fetchedEntriesMap = new Map();
        fetchedData.data.forEach((entry) => {
          const date = moment.utc(entry.work_date).format("YYYY-MM-DD");
          fetchedEntriesMap.set(date, {
            id: entry.id,
            date,
            morningActivity: entry.morning_activity || defaultActivity,
            afternoonActivity: entry.afternoon_activity || defaultActivity,
            facilityStartTime: formatTime(entry.facility_start_time) || "",
            facilityLunchStart: formatTime(entry.facility_lunch_start) || "",
            facilityLunchEnd: formatTime(entry.facility_lunch_end) || "",
            facilityEndTime: formatTime(entry.facility_end_time) || "",
            facilityTotalHours: entry.facility_total_hours
              ? `${entry.facility_total_hours.hours || 0}h ${
                  entry.facility_total_hours.minutes || 0
                }m`
              : "0h 0m", // Properly format the total hours if available

            drivingStartTime: formatTime(entry.driving_start_time) || "",
            drivingLunchStart: formatTime(entry.driving_lunch_start) || "",
            drivingLunchEnd: formatTime(entry.driving_lunch_end) || "",
            drivingEndTime: formatTime(entry.driving_end_time) || "",
            drivingTotalHours: entry.driving_total_hours
              ? `${entry.driving_total_hours.hours || 0}h ${
                  entry.driving_total_hours.minutes || 0
                }m`
              : "0h 0m", // Properly format the total hours if available

            status: entry.status || "active",
          });
          console.log(`Setting fetched entry for date: ${date}`);
        });

        // Convert map values to an array of entries
        const fetchedEntries = Array.from(fetchedEntriesMap.values());

        // Initialize validation messages for each entry
        setValidationMessages(
          fetchedEntries.reduce(
            (acc, _, idx) => ({
              ...acc,
              [idx]: {}, // Initialize empty messages for each index
            }),
            {}
          )
        );

        // Create entries for missing dates
        const allWeekdays = [];
        let currentDate = adjustedStartDate.clone();
        for (let i = 0; i < 14; i++) {
          if (isWeekday(currentDate)) {
            allWeekdays.push(currentDate.clone());
          }
          currentDate.add(1, "day");
        }

        const missingDates = allWeekdays
          .map((date) => date.format("YYYY-MM-DD"))
          .filter((date) => !fetchedEntriesMap.has(date));

        console.log("Missing Dates:", missingDates);

        // Create missing entries via POST requests
        const createdEntriesPromises = missingDates.map(async (date) => {
          const newEntry = {
            work_date: date,
            facility_start_time: "",
            facility_lunch_start: "",
            facility_lunch_end: "",
            facility_end_time: "",
            facility_total_hours: "0h 0m",
            driving_start_time: "",
            driving_lunch_start: "",
            driving_lunch_end: "",
            driving_end_time: "",
            driving_total_hours: "0h 0m",
            status: "active",
            employee_id: employeeId,
            morning_activity: defaultActivity,
            afternoon_activity: defaultActivity,
          };

          console.log(`Creating new entry for date: ${date}`);

          try {
            const postResponse = await fetch(`${API}/timecards`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newEntry),
            });

            if (!postResponse.ok) {
              const errorText = await postResponse.text();
              console.error(`Failed to create entry for ${date}: ${errorText}`);
              throw new Error(
                `Failed to create entry for ${date}: ${errorText}`
              );
            }

            const savedEntry = await postResponse.json();
            console.log(
              `New entry created for date ${date} with ID: ${savedEntry.data.id}`
            );

            return {
              id: savedEntry.data.id,
              date: savedEntry.data.work_date,
              facilityStartTime:
                formatTime(savedEntry.data.facility_start_time) || "",
              facilityLunchStart:
                formatTime(savedEntry.data.facility_lunch_start) || "",
              facilityLunchEnd:
                formatTime(savedEntry.data.facility_lunch_end) || "",
              facilityEndTime:
                formatTime(savedEntry.data.facility_end_time) || "",
              facilityTotalHours:
                typeof savedEntry.data.facility_total_hours === "string"
                  ? savedEntry.data.facility_total_hours
                  : "0h 0m",
              drivingStartTime:
                formatTime(savedEntry.data.driving_start_time) || "",
              drivingLunchStart:
                formatTime(savedEntry.data.driving_lunch_start) || "",
              drivingLunchEnd:
                formatTime(savedEntry.data.driving_lunch_end) || "",
              drivingEndTime:
                formatTime(savedEntry.data.driving_end_time) || "",
              drivingTotalHours:
                typeof savedEntry.data.driving_total_hours === "string"
                  ? savedEntry.data.driving_total_hours
                  : "0h 0m",
              status: savedEntry.data.status || "active",
              morningActivity: defaultActivity,
              afternoonActivity: defaultActivity,
            };
          } catch (error) {
            console.error(`Error creating entry for ${date}:`, error);
            return null;
          }
        });

        const createdEntriesResults = await Promise.all(createdEntriesPromises);
        const successfulCreatedEntries = createdEntriesResults.filter(
          (entry) => entry !== null
        );

        console.log(
          `Successfully created ${successfulCreatedEntries.length} new entries.`
        );

        // Combine fetched and newly created entries
        const allEntries = [
          ...Array.from(fetchedEntriesMap.values()),
          ...successfulCreatedEntries,
        ];
        // Update timeCard state
        setTimeCard({ entries: allEntries, isSubmitted: false });
      } catch (error) {
        console.error("Error fetching timecard data:", error);
        setTimeCard({ entries: [], isSubmitted: false });
      } finally {
        setIsLoading(false);
      }
    },
    [employeeId, defaultActivity]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (hasFetched.current) {
        console.log("Skipping fetch: already fetched.");
        return;
      }

      if (!employeeId) {
        console.log("Skipping fetch: employeeId is missing.");
        return;
      }

      console.log("Fetching data for employee:", employeeId);

      try {
        hasFetched.current = true;

        let storedStartDateStr = localStorage.getItem("startDate");
        let startDate = storedStartDateStr
          ? moment.utc(new Date(storedStartDateStr))
          : moment.utc();

        console.log("Original start date:", startDate.format("YYYY-MM-DD"));

        if (startDate.day() === 0) {
          console.log("Adjusting start date from Sunday to Monday");
          startDate.add(1, "day");
          localStorage.setItem("startDate", startDate.toISOString());
          console.log(
            "Adjusted start date saved:",
            startDate.format("YYYY-MM-DD")
          );
          setStartDateAdjusted(true); // Mark adjustment as done
          return; // Exit to allow re-render
        }

        console.log(
          "Adjusted Start Date for fetching:",
          startDate.format("YYYY-MM-DD")
        );

        const previousMonday = getPreviousMonday(startDate.toDate());
        console.log(
          "Previous Monday for fetching:",
          previousMonday.toISOString()
        );

        await fetchTimeCardData(previousMonday);
      } catch (error) {
        console.error("Error during initial data fetch:", error);
        hasFetched.current = false;
      }
    };

    fetchData();
  }, [fetchTimeCardData, employeeId, startDateAdjusted]);

  const calculateTotalTime = (start, lunchStart, lunchEnd, end) => {
    console.log("Calculating total time with:", {
      start,
      lunchStart,
      lunchEnd,
      end,
    });

    const parseTime = (time) => (time ? moment(time, "HH:mm") : null);
    const startTime = parseTime(start);
    const lunchStartTime = parseTime(lunchStart);
    const lunchEndTime = parseTime(lunchEnd);
    const endTime = parseTime(end);

    let totalMinutes = 0;

    if (startTime && lunchStartTime) {
      totalMinutes += (lunchStartTime - startTime) / (1000 * 60);
    }

    if (lunchEndTime && endTime) {
      totalMinutes += (endTime - lunchEndTime) / (1000 * 60);
    }

    if (startTime && endTime && !lunchStartTime && !lunchEndTime) {
      totalMinutes = (endTime - startTime) / (1000 * 60);
    }

    if (startTime && lunchStartTime && lunchEndTime && !endTime) {
      totalMinutes = (lunchStartTime - startTime) / (1000 * 60);
    }

    totalMinutes = Math.max(totalMinutes, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const totalTime = `${hours}h ${minutes}m`;
    console.log("Calculated Total Time:", totalTime);
    return totalTime || "00:00";
  };

  const isWeekday = (date) => {
    const day = moment(date).day();
    return day !== 0 && day !== 6; // Not Sunday (0) or Saturday (6)
  };

  const calculateTotalTimeForAllEntries = () => {
    let facilityTotalMinutes = 0;
    let drivingTotalMinutes = 0;

    timeCard.entries.forEach((entry) => {
      //console.log('Current entry for total time calculation:', entry);
      if (typeof entry.facilityTotalHours === "string") {
        const [facilityHours, facilityMinutes] = entry.facilityTotalHours
          .split(" ")
          .map((val) => parseInt(val) || 0);
        facilityTotalMinutes += facilityHours * 60 + facilityMinutes;
      } else {
        console.warn(
          "facilityTotalHours is not a string:",
          entry.facilityTotalHours
        );
      }

      if (typeof entry.drivingTotalHours === "string") {
        const [drivingHours, drivingMinutes] = entry.drivingTotalHours
          .split(" ")
          .map((val) => parseInt(val) || 0);
        drivingTotalMinutes += drivingHours * 60 + drivingMinutes;
      } else {
        console.warn(
          "drivingTotalHours is not a string:",
          entry.drivingTotalHours
        );
      }
    });

    const totalFacilityHours = Math.floor(facilityTotalMinutes / 60);
    const remainingFacilityMinutes = facilityTotalMinutes % 60;
    const facilityTotalTime = `${totalFacilityHours}h ${remainingFacilityMinutes}m`;

    const totalDrivingHours = Math.floor(drivingTotalMinutes / 60);
    const remainingDrivingMinutes = drivingTotalMinutes % 60;
    const drivingTotalTime = `${totalDrivingHours}h ${remainingDrivingMinutes}m`;

    return `${facilityTotalTime} / ${drivingTotalTime}`;
  };

  const validateAMPM = (index, time, field) => {
    if (!time || time.length < 5) {
      // Clear message if input is invalid or empty
      setValidationMessages((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: "", // Clear any previous message for this field
        },
      }));
      return;
    }

    const parsedTime = moment(time, "HH:mm");
    let message = "";

    // Validate start time (should be AM)
    if (field === "startTime" && parsedTime.isAfter(moment("12:00", "HH:mm"))) {
      message = "Start time should be in AM.";
    }

    // Validate end time (should be PM)
    if (field === "endTime" && parsedTime.isBefore(moment("12:00", "HH:mm"))) {
      message = "End time should be in PM.";
    }

    // Update validation messages
    setValidationMessages((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: message, // Update message for this field
      },
    }));
  };

  const isValidTimeOrder = (start, lunchStart, lunchEnd, end) => {
    if (
      start &&
      lunchStart &&
      moment(lunchStart, "HH:mm").isBefore(moment(start, "HH:mm"))
    ) {
      alert("Lunch start cannot be before start time.");
      return false; // Lunch start cannot be before start time
    }
    if (
      lunchStart &&
      lunchEnd &&
      moment(lunchEnd, "HH:mm").isBefore(moment(lunchStart, "HH:mm"))
    ) {
      alert("Lunch end cannot be before lunch start.");
      return false; // Lunch end cannot be before lunch start
    }
    if (
      end &&
      lunchEnd &&
      moment(end, "HH:mm").isBefore(moment(lunchEnd, "HH:mm"))
    ) {
      alert("End time cannot be before lunch end.");
      return false; // End time cannot be before lunch end
    }
    if (end && start && moment(end, "HH:mm").isBefore(moment(start, "HH:mm"))) {
      alert("End time cannot be before start time.");
      return false; // End time cannot be before start time
    }
    return true;
  };

  const handleChange = (index, field, value) => {
    // Log the current arguments received by the function
    console.log("handleChange called with:", { index, field, value });
    setTimeCard((prevState) => {
      const updatedEntries = [...prevState.entries];
      const entry = updatedEntries[index];

      console.log("Current entry before update:", entry);

      // Call validateAMPM when changing time fields
      if (
        ["startTime", "lunchStart", "lunchEnd", "endTime"].includes(field) &&
        value.length >= 5 // Validate only when input is likely complete
      ) {
        validateAMPM(index, value, field);
      }

      // Set default activity if none is selected or provided
      if (
        field === "morning_activity" &&
        (value === undefined || value === null || value === "")
      ) {
        entry.morning_activity = defaultActivity;
      } else if (
        field === "afternoon_activity" &&
        (value === undefined || value === null || value === "")
      ) {
        entry.afternoon_activity = defaultActivity;
      } else {
        entry[field] = value;
      }

      // Log after updating the field value
      console.log("Updated entry after setting field value:", entry);

      // Check if the entry is already submitted
      if (entry.status === "submitted") {
        console.log(
          `Cannot update entry for date ${entry.date} as it is already submitted.`
        );
        alert(
          `You cannot modify the entry for ${moment(entry.date).format(
            "MMMM Do, YYYY"
          )} because it has already been submitted.`
        );
        return prevState; // Return unchanged state if the entry is submitted
      }

      // Update the specified field with the new value
      entry[field] = value;

      // Update activity dropdown (morning or afternoon)
      if (field === "morning_activity" || field === "afternoon_activity") {
        entry[field] = value;

        // Clear related fields when switching activities
        if (value === "Facility") {
          // Clear driving fields if switching to Facility
          entry.drivingStartTime = null;
          entry.drivingLunchStart = null;
          entry.drivingLunchEnd = null;
          entry.drivingEndTime = null;

          // Log after clearing driving fields
          console.log("Updated entry after clearing driving fields:", entry);
        } else if (value === "Driving") {
          // Clear facility fields if switching to Driving
          entry.facilityStartTime = null;
          entry.facilityLunchStart = null;
          entry.facilityLunchEnd = null;
          entry.facilityEndTime = null;

          // Log after clearing facility fields
          console.log("Updated entry after clearing facility fields:", entry);
        }
      } else {
        // Update time fields based on the current activity selection
        if (entry.morning_activity === "Facility") {
          if (field.startsWith("driving")) {
            // Prevent updating driving fields when activity is Facility
            console.warn(`Ignoring driving field update for Facility activity`);
          } else {
            entry[field] = value;
          }
        } else if (entry.morning_activity === "Driving") {
          if (field.startsWith("facility")) {
            // Prevent updating facility fields when activity is Driving
            console.warn(`Ignoring facility field update for Driving activity`);
          } else {
            entry[field] = value;
          }
        }

        // Log after updating activity-based time fields
        console.log("Updated entry after activity-based time update:", entry);

        // Validate time order and calculate total time after time change
        if (
          isValidTimeOrder(
            entry.facilityStartTime,
            entry.facilityLunchStart,
            entry.facilityLunchEnd,
            entry.facilityEndTime
          )
        ) {
          entry.facilityTotalHours = calculateTotalTime(
            entry.facilityStartTime,
            entry.facilityLunchStart,
            entry.facilityLunchEnd,
            entry.facilityEndTime
          );
        } else {
          entry.facilityTotalHours = "0h 0m";
        }

        if (
          isValidTimeOrder(
            entry.drivingStartTime,
            entry.drivingLunchStart,
            entry.drivingLunchEnd,
            entry.drivingEndTime
          )
        ) {
          entry.drivingTotalHours = calculateTotalTime(
            entry.drivingStartTime,
            entry.drivingLunchStart,
            entry.drivingLunchEnd,
            entry.drivingEndTime
          );
        } else {
          entry.drivingTotalHours = "0h 0m";
        }
      }

      console.log("Updated entry after calculation:", entry);

      // Ensure status is active if it is not submitted
      if (entry.status !== "submitted") {
        entry.status = "active";
      }

      // Set the entry to update for the API call
      setEntryToUpdate(entry);

      return { ...prevState, entries: updatedEntries };
    });
  };

  // Update useEffect to include activity in the payload
  useEffect(() => {
    if (!entryToUpdate) return; // Exit if there's no entry to update

    // Construct the payload based on the updated entry
    const requestPayload = {
      employee_id: employeeId,
      work_date: entryToUpdate.date,
      morning_activity: entryToUpdate.morningActivity || defaultActivity,
      afternoon_activity: entryToUpdate.afternoonActivity || defaultActivity,
      facility_start_time: entryToUpdate.facilityStartTime || null,
      facility_lunch_start: entryToUpdate.facilityLunchStart || null,
      facility_lunch_end: entryToUpdate.facilityLunchEnd || null,
      facility_end_time: entryToUpdate.facilityEndTime || null,
      facility_total_hours:
        typeof entryToUpdate.facilityTotalHours === "string"
          ? entryToUpdate.facilityTotalHours
          : "0h 0m",
      driving_start_time: entryToUpdate.drivingStartTime || null,
      driving_lunch_start: entryToUpdate.drivingLunchStart || null,
      driving_lunch_end: entryToUpdate.drivingLunchEnd || null,
      driving_end_time: entryToUpdate.drivingEndTime || null,
      driving_total_hours:
        typeof entryToUpdate.drivingTotalHours === "string"
          ? entryToUpdate.drivingTotalHours
          : "0h 0m",
      status: entryToUpdate.status || "active",
    };

    console.log("Request payload for update:", requestPayload);

    const updateEntry = async () => {
      try {
        const response = await fetch(`${API}/timecards/${entryToUpdate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload),
        });

        console.log("Fetched data:", response);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save entry: ${errorText}`);
        }

        const result = await response.json();
        console.log("Response from server:", result);

        // Update local state with the server response
        setTimeCard((prevState) => {
          return {
            ...prevState,
            entries: prevState.entries.map((entry) => {
              if (entry.id === result.data.id) {
                return {
                  ...entry,
                  work_date: result.data.work_date,
                  morning_activity:
                    result.data.morning_activity || defaultActivity,
                  afternoon_activity:
                    result.data.afternoon_activity || defaultActivity,
                  facility_start_time: result.data.facility_start_time || "",
                  facility_lunch_start: result.data.facility_lunch_start || "",
                  facility_lunch_end: result.data.facility_lunch_end || "",
                  facility_end_time: result.data.facility_end_time || "",
                  facility_total_hours:
                    typeof result.data.facility_total_hours === "string"
                      ? result.data.facility_total_hours
                      : "0h 0m",
                  driving_start_time: result.data.driving_start_time || "",
                  driving_lunch_start: result.data.driving_lunch_start || "",
                  driving_lunch_end: result.data.driving_lunch_end || "",
                  driving_end_time: result.data.driving_end_time || "",
                  driving_total_hours:
                    typeof result.data.driving_total_hours === "string"
                      ? result.data.driving_total_hours
                      : "0h 0m",
                  status: result.data.status || "active",
                };
              }
              return entry;
            }),
          };
        });

        console.log(
          `Successfully updated timecard with ID ${result.data.id} for date: ${result.data.work_date}`
        );
      } catch (error) {
        console.error(`Error during PUT operation:`, error);
        alert(`Error saving timecard entry: ${error.message}`);
      }
    };

    updateEntry(); // Call the function to perform the API update

    setEntryToUpdate(null); // Reset after update
  }, [employeeId, entryToUpdate, defaultActivity]); // Run this effect whenever entryToUpdate changes

  const handleSubmit = async () => {
    const twoWeekPeriod = timeCard.entries;
    console.log("Entries before submission:", twoWeekPeriod);

    const alreadySubmittedEntries = twoWeekPeriod.every(
      (entry) => entry.status === "submitted"
    );
    console.log(
      "Checking if all entries are submitted:",
      alreadySubmittedEntries
    );

    if (alreadySubmittedEntries) {
      alert("All entries are already submitted.");
      return;
    }

    const requiredFields = [
      "facility_start_time",
      "facility_lunch_start",
      "facility_lunch_end",
      "facility_end_time",
      "driving_start_time",
      "driving_lunch_start",
      "driving_lunch_end",
      "driving_end_time",
    ];

    const incompleteEntries = twoWeekPeriod.filter((entry) =>
      requiredFields.some((field) => {
        const value = entry[field];
        // Check if value is null, undefined, or an empty string
        return value === null || value === undefined || value.trim() === "";
      })
    );

    console.log("Incomplete entries:", incompleteEntries);

    // If there are incomplete days, prompt the user
    if (incompleteEntries.length > 0) {
      const confirmation = window.confirm(
        `There are incomplete entries. Do you still want to proceed with submission?`
      );
      if (!confirmation) {
        console.log("User canceled submission due to incomplete entries.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await Promise.all(
        twoWeekPeriod.map(async (entry) => {
          if (entry.id) {
            const url = `${API}/timecards/${entry.id}`;
            const requestPayload = {
              status: "submitted",
              work_date: entry.date,
            };

            try {
              const response = await fetch(url, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestPayload),
              });

              if (!response.ok) {
                const errorMessage = await response.text();
                console.error(
                  `Failed to submit entry for ${entry.date}: ${errorMessage}`
                );
                throw new Error(errorMessage);
              } else {
                console.log(`Successfully updated entry with ID: ${entry.id}`);
              }
            } catch (error) {
              console.error(
                `Error during PUT operation for date ${entry.date}:`,
                error
              );
            }
          }
        })
      );

      console.log("All submissions succeeded. Triggering confetti.");

      // Play the submission sound
      const audio = new Audio(mySound);
      audio.play();

      setShowConfetti(true);
      setIsSubmitted(true);

      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0; // Reset playback to the start
        setShowConfetti(false);
        console.log("Hiding confetti and stopping audio after 5 seconds");
        setIsNewTimeCardCreated(false);
        afterSubmitReset();
        navigate("/CreatenewTimeCard");
      }, 5000);
    } catch (error) {
      console.error("Unexpected error submitting timecard:", error);
      alert(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (timeCard.entries.some((entry) => entry.status === "submitted")) {
      alert("Cannot reset a submitted timecard.");
      return;
    }

    const confirmation = window.confirm(
      "Are you sure you want to reset the timecard? All data entered will be lost."
    );
    if (!confirmation) return;

    try {
      setIsLoading(true);

      await Promise.all(
        timeCard.entries.map(async (entry) => {
          if (entry.id) {
            const url = `${API}/timecards/${entry.id}`;
            const response = await fetch(url, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
              const errorMessage = await response.text();
              console.error(
                `Failed to delete entry ID ${entry.id}: ${errorMessage}`
              );
              throw new Error(errorMessage);
            }
            console.log(`Successfully deleted entry with ID: ${entry.id}`);
          }
        })
      );

      setTimeCard({ entries: [], isSubmitted: false });
      localStorage.removeItem("currentTimeCard");
      localStorage.removeItem("startDate");
      setIsNewTimeCardCreated(false);
      navigate("/createnewTimeCard");
    } catch (error) {
      console.error("Error deleting entries:", error);
      alert(
        "An error occurred while trying to reset the timecard. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const afterSubmitReset = () => {
    setTimeCard({ entries: [], isSubmitted: false });
    localStorage.removeItem("currentTimeCard");
    localStorage.removeItem("startDate");
    setIsNewTimeCardCreated(false);
  };

  console.log("Rendering timeCard entries:", timeCard.entries);
  timeCard.entries.forEach((entry) => {
    //console.log({ facilityTotalHours: entry.facilityTotalHours }); // Log the facilityTotalHours of each entry before rendering
  });

  // Desktop layout

  return (
    <div className={`container-fluid mt-4 ${styles.container}`}>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,
          }}
        />
      )}

      <h2 className="text-center mb-4">Active Timecard</h2>

      <div className={styles.buttonGroup}>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isSubmitting || isSubmitted || isLoading}
        >
          {isSubmitting
            ? "Submitting..."
            : isSubmitted
            ? "Submitted"
            : "Turn in your Timecard"}
        </button>

        <button
          className="btn btn-danger"
          onClick={handleReset}
          disabled={isSubmitting || isLoading}
        >
          {isLoading ? "Resetting..." : "Reset"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => navigate("/createNewTimecard")}
        >
          Back to Calendar
        </button>
      </div>

      {/* Key explanation with delete red dot */}
      <div className={`text-center ${styles.instructions}`}>
        <p>
          click <span style={{ color: "red" }}>🔴</span> to delete time.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border custom-spinner" role="status"></div>
          <div className="mt-2">Loading timecard data...</div>
        </div>
      ) : (
        <div className={`table-responsive ${styles.tableWrapper}`}>
          <table className={`table table-bordered table-sm ${styles.table}`}>
            <thead>
              <tr>
                <th>Date</th>
                <th className={styles.activityColumn}>AM Activity</th>
                <th className={styles.timeColumn}>Start Time</th>
                <th className={styles.timeColumn}>Lunch Start</th>
                <th className={styles.activityColumn}>PM Activity</th>
                <th className={styles.timeColumn}>Lunch End</th>
                <th className={styles.timeColumn}>End Time</th>
                <th className={styles.totalTimeColumn}>Facility Total Time</th>
                <th className={styles.totalTimeColumn}>Driving Total Time</th>
              </tr>
            </thead>

            <tbody>
              {timeCard.entries.map((entry, index) => (
                <tr key={entry.date}>
                  <td className={styles.dateColumn}>
                    <div>{moment.utc(entry.date).format("dddd")}</div>
                    <div>{moment.utc(entry.date).format("MMM D, YYYY")}</div>
                  </td>

                  {/* Morning Activity */}
                  <td>
                    <select
                      value={entry.morningActivity || defaultActivity}
                      onChange={(e) =>
                        handleChange(index, "morningActivity", e.target.value)
                      }
                      className="form-select w-200"
                    >
                      <option value="Facility">Facility</option>
                      <option value="Driving">Driving</option>
                    </select>
                  </td>

                  {/* Facility or Driving Start Time */}
                  <td className={styles.timeColumn}>
                    <div className="d-flex align-items-center">
                      <input
                        type="time"
                        className="form-control"
                        value={
                          entry.morningActivity === "Facility"
                            ? entry.facilityStartTime || ""
                            : entry.morningActivity === "Driving"
                            ? entry.drivingStartTime || ""
                            : "" // Fallback to an empty value if neither activity is set
                        }
                        onChange={(e) =>
                          handleChange(
                            index,
                            entry.morningActivity === "Facility"
                              ? "facilityStartTime"
                              : "drivingStartTime",
                            e.target.value
                          )
                        }
                        onBlur={(e) =>
                          validateAMPM(index, e.target.value, "startTime")
                        }
                      />
                      <span
                        style={{
                          color: "red",
                          marginLeft: "5px",
                          cursor:
                            entry.status === "active"
                              ? "pointer"
                              : "not-allowed", // Change cursor if not active
                        }}
                        onClick={() => {
                          if (entry.status === "active") {
                            handleChange(
                              index,
                              entry.morningActivity === "Facility"
                                ? "facilityStartTime"
                                : "drivingStartTime",
                              null
                            );
                          } else {
                            alert(
                              "You cannot delete this timecard entry because it has already been submitted."
                            );
                          }
                        }}
                      >
                        🔴
                      </span>
                    </div>

                    {validationMessages[index]?.startTime && (
                      <div style={{ color: "red", fontSize: "0.85em" }}>
                        {validationMessages[index].startTime}
                      </div>
                    )}
                  </td>

                  {/* Facility or Driving Lunch Start */}
                  <td className={styles.timeColumn}>
                    <div className="d-flex align-items-center">
                      <input
                        type="time"
                        className="form-control"
                        value={
                          entry.morningActivity === "Facility"
                            ? entry.facilityLunchStart || ""
                            : entry.morningActivity === "Driving"
                            ? entry.drivingLunchStart || ""
                            : ""
                        }
                        onChange={(e) =>
                          handleChange(
                            index,
                            entry.morningActivity === "Facility"
                              ? "facilityLunchStart"
                              : "drivingLunchStart",
                            e.target.value
                          )
                        }
                        onBlur={(e) =>
                          validateAMPM(index, e.target.value, "LunchStart")
                        }
                      />
                      <span
                        style={{
                          color: "red",
                          marginLeft: "5px",
                          cursor:
                            entry.status === "active"
                              ? "pointer"
                              : "not-allowed",
                        }}
                        onClick={() => {
                          if (entry.status === "active") {
                            handleChange(
                              index,
                              entry.morningActivity === "Facility"
                                ? "facilityLunchStart"
                                : "drivingLunchStart",
                              null
                            );
                          } else {
                            alert(
                              "You cannot delete this timecard entry because it has already been submitted."
                            );
                          }
                        }}
                      >
                        🔴
                      </span>
                    </div>

                    {validationMessages[index]?.lunchStart && (
                      <div style={{ color: "red", fontSize: "0.85em" }}>
                        {validationMessages[index].lunchStart}
                      </div>
                    )}
                  </td>

                  {/* Afternoon Activity */}
                  <td>
                    <select
                      value={entry.afternoonActivity || defaultActivity}
                      onChange={(e) =>
                        handleChange(index, "afternoonActivity", e.target.value)
                      }
                      className="form-select"
                    >
                      <option value="Facility">Facility</option>
                      <option value="Driving">Driving</option>
                    </select>
                  </td>

                  {/* Facility or Driving Lunch End */}
                  <td className={styles.timeColumn}>
                    <div className="d-flex align-items-center">
                      <input
                        type="time"
                        className="form-control"
                        value={
                          entry.afternoonActivity === "Facility"
                            ? entry.facilityLunchEnd || ""
                            : entry.afternoonActivity === "Driving"
                            ? entry.drivingLunchEnd || ""
                            : ""
                        }
                        onChange={(e) =>
                          handleChange(
                            index,
                            entry.afternoonActivity === "Facility"
                              ? "facilityLunchEnd"
                              : "drivingLunchEnd",
                            e.target.value
                          )
                        }
                        onBlur={(e) =>
                          validateAMPM(index, e.target.value, "LunchEnd")
                        }
                      />
                      <span
                        style={{
                          color: "red",
                          marginLeft: "5px",
                          cursor:
                            entry.status === "active"
                              ? "pointer"
                              : "not-allowed",
                        }}
                        onClick={() => {
                          if (entry.status === "active") {
                            handleChange(
                              index,
                              entry.afternoonActivity === "Facility"
                                ? "facilityLunchEnd"
                                : "drivingLunchEnd",
                              null
                            );
                          } else {
                            alert(
                              "You cannot delete this timecard entry because it has already been submitted."
                            );
                          }
                        }}
                      >
                        🔴
                      </span>
                    </div>

                    {validationMessages[index]?.lunchEnd && (
                      <div style={{ color: "red", fontSize: "0.85em" }}>
                        {validationMessages[index].lunchEnd}
                      </div>
                    )}
                  </td>

                  {/* Facility or Driving End Time */}
                  <td className={styles.timeColumn}>
                    <div className="d-flex align-items-center">
                      <input
                        type="time"
                        className="form-control"
                        value={
                          entry.afternoonActivity === "Facility"
                            ? entry.facilityEndTime || ""
                            : entry.afternoonActivity === "Driving"
                            ? entry.drivingEndTime || ""
                            : ""
                        }
                        onChange={(e) =>
                          handleChange(
                            index,
                            entry.afternoonActivity === "Facility"
                              ? "facilityEndTime"
                              : "drivingEndTime",
                            e.target.value
                          )
                        }
                        onBlur={(e) =>
                          validateAMPM(index, e.target.value, "EndTime")
                        }
                      />
                      <span
                        style={{
                          color: "red",
                          marginLeft: "5px",
                          cursor:
                            entry.status === "active"
                              ? "pointer"
                              : "not-allowed",
                        }}
                        onClick={() => {
                          if (entry.status === "active") {
                            handleChange(
                              index,
                              entry.afternoonActivity === "Facility"
                                ? "facilityEndTime"
                                : "drivingEndTime",
                              null
                            );
                          } else {
                            alert(
                              "You cannot delete this timecard entry because it has already been submitted."
                            );
                          }
                        }}
                      >
                        🔴
                      </span>
                    </div>

                    {validationMessages[index]?.endTime && (
                      <div style={{ color: "red", fontSize: "0.85em" }}>
                        {validationMessages[index].endTime}
                      </div>
                    )}
                  </td>

                  {/* Facility Total Time */}
                  <td>{entry.facilityTotalHours}</td>

                  {/* Driving Total Time */}
                  <td>{entry.drivingTotalHours}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={7} style={{ textAlign: "right" }}>
                  <strong>Total Time:</strong>
                </td>
                <td>{calculateTotalTimeForAllEntries().split(" / ")[0]}</td>
                <td>{calculateTotalTimeForAllEntries().split(" / ")[1]}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
export default ActiveTimeCard;
