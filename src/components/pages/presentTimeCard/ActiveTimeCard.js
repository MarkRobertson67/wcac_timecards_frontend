
// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ActiveTimeCard.module.css';
import moment from 'moment-timezone';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const API = process.env.REACT_APP_API_URL;

function ActiveTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false); // Initialize the flag
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  const employeeId = 1;


  // Get window size for Confetti
  const { width, height } = useWindowSize();
  //console.log('Window Size:', width, height);

  const [entryToUpdate, setEntryToUpdate] = useState(null);



  const getPreviousMonday = (date) => {
    const utcDate = moment.utc(date); // Convert the input date to UTC
    const day = utcDate.day();

    // Get the last Monday based on the existing logic
    let lastMonday;
    if (day === 1) { // If the day is Monday (1)
      lastMonday = utcDate; // Return the same date in UTC
    } else if (day === 0) { // If the day is Sunday (0)
      lastMonday = utcDate.add(1, 'days'); // Move to Monday
    } else {
      lastMonday = utcDate.startOf('week').add(1, 'days'); // Start of the week is Sunday, get Monday
    }

    // Now adjust this Monday based on the 2-week schedule starting from the reference date
    const referenceDate = moment.utc("1970-01-05"); // Reference date
    const daysDifference = lastMonday.diff(referenceDate, 'days');
    const twoWeekPeriods = Math.floor(daysDifference / 14);
    const adjustedMonday = referenceDate.clone().add(twoWeekPeriods * 14, 'days');

    // Return the adjusted Monday
    return adjustedMonday;
  };


  const getEndDate = (startDate) => {
    return moment(startDate).add(13, 'days'); // Two-week period
  };


  const fetchTimeCardData = useCallback(async (startDate) => {
    try {
      // Set loading state
      setIsLoading(true);
      const timestamp = new Date().toLocaleString(); // Get the current timestamp
      console.log(`[${timestamp}] Fetching timecard data... likely due to page reload from inactivity`);

      const adjustedStartDate = getPreviousMonday(startDate);
      const endDate = getEndDate(adjustedStartDate);

      // Format dates
      const formattedStart = moment.utc(adjustedStartDate).format('YYYY-MM-DD');
      const formattedEnd = moment.utc(endDate).format('YYYY-MM-DD');

      console.log(`Fetching timecard data from ${formattedStart} to ${formattedEnd}`);

      // Fetch existing timecards from the backend
      const response = await fetch(`${API}/timecards/employee/${employeeId}/range/${formattedStart}/${formattedEnd}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fetchedData = await response.json();
      console.log("Fetched Data:", fetchedData);

      // Create a map for the fetched entries
      const fetchedEntriesMap = new Map();
      fetchedData.data.forEach(entry => {
        const date = moment.utc(entry.work_date).format('YYYY-MM-DD');
        //const totalTime = entry.total_time ? `${entry.total_time.hours}h ${entry.total_time.minutes}m` : '0h 0m';
        fetchedEntriesMap.set(date, {
          id: entry.id,
          date,
          facilityStartTime: entry.facility_start_time || '',
          facilityLunchStart: entry.facility_lunch_start || '',
          facilityLunchEnd: entry.facility_lunch_end || '',
          facilityEndTime: entry.facility_end_time || '',
          facilityTotalHours: entry.facility_total_hours || '0h 0m',
          drivingStartTime: entry.driving_start_time || '',
          drivingLunchStart: entry.driving_lunch_start || '',
          drivingLunchEnd: entry.driving_lunch_end || '',
          drivingEndTime: entry.driving_end_time || '',
          drivingTotalHours: entry.driving_total_hours || '0h 0m',
          status: entry.status || 'active'
        });
        console.log(`Setting fetched entry for date: ${date}`);
      });

      // Create entries for missing dates
      const allWeekdays = [];
      let currentDate = adjustedStartDate.clone();
      for (let i = 0; i < 14; i++) {
        if (isWeekday(currentDate)) {
          allWeekdays.push(currentDate.clone());
        }
        currentDate.add(1, 'day');
      }

      const missingDates = allWeekdays
        .map(date => date.format('YYYY-MM-DD'))
        .filter(date => !fetchedEntriesMap.has(date));

      console.log("Missing Dates:", missingDates);

      // Create missing entries via POST requests
      const createdEntriesPromises = missingDates.map(async (date) => {
        const newEntry = {
          work_date: date,
          facility_start_time: '',
          facility_lunch_start: '',
          facility_lunch_end: '',
          facility_end_time: '',
          facility_total_hours: '0h 0m',
          driving_start_time: '',
          driving_lunch_start: '',
          driving_lunch_end: '',
          driving_end_time: '',
          driving_total_hours: '0h 0m',
          status: 'active',
          employee_id: employeeId
        };

        console.log(`Creating new entry for date: ${date}`);

        try {
          const postResponse = await fetch(`${API}/timecards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEntry),
          });

          if (!postResponse.ok) {
            const errorText = await postResponse.text();
            console.error(`Failed to create entry for ${date}: ${errorText}`);
            throw new Error(`Failed to create entry for ${date}: ${errorText}`);
          }

          const savedEntry = await postResponse.json();
          console.log(`New entry created for date ${date} with ID: ${savedEntry.data.id}`);

          return {
            id: savedEntry.data.id,
            date: savedEntry.data.work_date,
            facilityStartTime: savedEntry.data.facility_start_time || '',
            facilityLunchStart: savedEntry.data.facility_lunch_start || '',
            facilityLunchEnd: savedEntry.data.facility_lunch_end || '',
            facilityEndTime: savedEntry.data.facility_end_time || '',
            facilityTotalHours: savedEntry.data.facility_total_hours || '0h 0m',
            drivingStartTime: savedEntry.data.driving_start_time || '',
            drivingLunchStart: savedEntry.data.driving_lunch_start || '',
            drivingLunchEnd: savedEntry.data.driving_lunch_end || '',
            drivingEndTime: savedEntry.data.driving_end_time || '',
            drivingTotalHours: savedEntry.data.driving_total_hours || '0h 0m',
            status: savedEntry.data.status || 'active'
          };
        } catch (error) {
          console.error(`Error creating entry for ${date}:`, error);
          return null;
        }
      });

      const createdEntriesResults = await Promise.all(createdEntriesPromises);
      const successfulCreatedEntries = createdEntriesResults.filter(entry => entry !== null);

      console.log(`Successfully created ${successfulCreatedEntries.length} new entries.`);

      // Combine fetched and newly created entries
      const allEntries = [...Array.from(fetchedEntriesMap.values()), ...successfulCreatedEntries];
      setTimeCard({ entries: allEntries, isSubmitted: false });

    } catch (error) {
      console.error('Error fetching timecard data:', error);
      setTimeCard({ entries: [], isSubmitted: false });
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);


  useEffect(() => {
    const fetchData = async () => {
      if (hasFetched.current) return; // Exit early if already fetched

      try {
        hasFetched.current = true; // Set the flag to prevent multiple fetches

        const storedStartDateStr = localStorage.getItem('startDate');
        const startDate = storedStartDateStr ? new Date(storedStartDateStr) : new Date();
        console.log("Start Date for fetching:", startDate.toISOString());

        const previousMonday = getPreviousMonday(startDate); // Adjust to previous Monday
        console.log("Previous Monday for fetching:", previousMonday.toISOString());

        await fetchTimeCardData(previousMonday);
      } catch (error) {
        console.error("Error during initial data fetch:", error);
        hasFetched.current = false; // Reset if there's an error to allow retrying
      }
    };

    fetchData();
  }, [fetchTimeCardData]);



  const calculateTotalTime = (startTime, lunchStartTime, lunchEndTime, endTime) => {
    const parseTime = (time) => (time ? moment(time, 'HH:mm') : null);
    const parsedStartTime = parseTime(startTime);
    const parsedLunchStartTime = parseTime(lunchStartTime);
    const parsedLunchEndTime = parseTime(lunchEndTime);
    const parsedEndTime = parseTime(endTime);

    let totalMinutes = 0;

    if (parsedStartTime && parsedLunchStartTime) {
      const duration = parsedLunchStartTime.diff(parsedStartTime, 'minutes');
      totalMinutes += Math.max(duration, 0); // Ensure no negative values
    }

    if (parsedLunchEndTime && parsedEndTime) {
      const duration = parsedEndTime.diff(parsedLunchEndTime, 'minutes');
      totalMinutes += Math.max(duration, 0);
    }

    if (parsedStartTime && parsedEndTime && !parsedLunchStartTime && !parsedLunchEndTime) {
      const duration = parsedEndTime.diff(parsedStartTime, 'minutes');
      totalMinutes += Math.max(duration, 0);
    }

    if (parsedStartTime && parsedLunchStartTime && parsedLunchEndTime && !parsedEndTime) {
      const duration = parsedLunchStartTime.diff(parsedStartTime, 'minutes');
      totalMinutes += Math.max(duration, 0);
    }

    totalMinutes = Math.max(totalMinutes, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const totalTime = `${hours}h ${minutes}m`;
    console.log('Calculated Total Time:', totalTime);
    return totalTime || '0h 0m';
  };



  const isWeekday = (date) => {
    const day = moment(date).day();
    return day !== 0 && day !== 6; // Not Sunday (0) or Saturday (6)
  };



  // const calculateTotalTimeForAllEntries = () => {
  //   let facilityTotalMinutes = 0;
  //   let drivingTotalMinutes = 0;

  //   timeCard.entries.forEach((entry) => {
  //     const [facilityHours, facilityMinutes] = entry.facilityTotalHours.split(' ').map((val) => parseInt(val) || 0);
  //     const [drivingHours, drivingMinutes] = entry.drivingTotalHours.split(' ').map((val) => parseInt(val) || 0);

  //     facilityTotalMinutes += facilityHours * 60 + facilityMinutes;
  //     drivingTotalMinutes += drivingHours * 60 + drivingMinutes;
  //   });

  //   const totalFacilityHours = Math.floor(facilityTotalMinutes / 60);
  //   const remainingFacilityMinutes = facilityTotalMinutes % 60;
  //   const facilityTotalTime = `${totalFacilityHours}h ${remainingFacilityMinutes}m`;

  //   const totalDrivingHours = Math.floor(drivingTotalMinutes / 60);
  //   const remainingDrivingMinutes = drivingTotalMinutes % 60;
  //   const drivingTotalTime = `${totalDrivingHours}h ${remainingDrivingMinutes}m`;

  //   return `${facilityTotalTime} / ${drivingTotalTime}`;
  // };

  const calculateTotalTimeForAllEntries = () => {
    let facilityTotalMinutes = 0;
    let drivingTotalMinutes = 0;
  
    timeCard.entries.forEach((entry) => {
      // Parse facility total time
      const [facilityHours, facilityMinutes] = entry.facilityTotalHours.split(' ').map((val) => parseInt(val) || 0);
      facilityTotalMinutes += facilityHours * 60 + facilityMinutes;
  
      // Parse driving total time
      const [drivingHours, drivingMinutes] = entry.drivingTotalHours.split(' ').map((val) => parseInt(val) || 0);
      drivingTotalMinutes += drivingHours * 60 + drivingMinutes;
    });
  
    // Calculate total Facility time
    const totalFacilityHours = Math.floor(facilityTotalMinutes / 60);
    const remainingFacilityMinutes = facilityTotalMinutes % 60;
    const facilityTotalTime = `${totalFacilityHours}h ${remainingFacilityMinutes}m`;
  
    // Calculate total Driving time
    const totalDrivingHours = Math.floor(drivingTotalMinutes / 60);
    const remainingDrivingMinutes = drivingTotalMinutes % 60;
    const drivingTotalTime = `${totalDrivingHours}h ${remainingDrivingMinutes}m`;
  
    return `${facilityTotalTime} / ${drivingTotalTime}`;
  };


  // Helper function to parse and check AM/PM
  const validateAMPM = (time, field) => {
    const parsedTime = moment(time, 'HH:mm');

    if (field === 'startTime' || field === 'lunchStart') {
      // Alert if the start or lunch start time is entered as PM (past 12:00 PM)
      if (parsedTime.isAfter(moment('12:00', 'HH:mm'))) {
        alert(`${field === 'startTime' ? 'Start time' : 'Lunch start time'} seems to be in the PM. Should it be AM?`);
      }
    } else if (field === 'lunchEnd' || field === 'endTime') {
      // Alert if lunch end or end time is entered as AM (before 12:00 PM)
      if (parsedTime.isBefore(moment('12:00', 'HH:mm'))) {
        alert(`${field === 'lunchEnd' ? 'Lunch end time' : 'End time'} seems to be in the AM. Should it be PM?`);
      }
    }
  };


  const isValidTimeOrder = (start, lunchStart, lunchEnd, end) => {
    if (start && lunchStart && moment(lunchStart, 'HH:mm').isBefore(moment(start, 'HH:mm'))) {
      alert('Lunch start cannot be before start time.');
      return false; // Lunch start cannot be before start time
    }
    if (lunchStart && lunchEnd && moment(lunchEnd, 'HH:mm').isBefore(moment(lunchStart, 'HH:mm'))) {
      alert('Lunch end cannot be before lunch start.');
      return false; // Lunch end cannot be before lunch start
    }
    if (end && lunchEnd && moment(end, 'HH:mm').isBefore(moment(lunchEnd, 'HH:mm'))) {
      alert('End time cannot be before lunch end.');
      return false; // End time cannot be before lunch end
    }
    if (end && start && moment(end, 'HH:mm').isBefore(moment(start, 'HH:mm'))) {
      alert('End time cannot be before start time.');
      return false; // End time cannot be before start time
    }
    return true;
  };


  // const handleChange = (index, field, value) => {
  //   setTimeCard((prevState) => {
  //     const updatedEntries = [...prevState.entries];
  //     const entry = updatedEntries[index];

  //     console.log('Current entry before update:', entry);


  //     // Check if the entry is already submitted
  //     if (entry.status === 'submitted') {
  //       console.log(`Cannot update entry for date ${entry.date} as it is already submitted.`);
  //       alert(`You cannot modify the entry for ${moment(entry.date).format('MMMM Do, YYYY')} because it has already been submitted.`);
  //       return prevState; // Return unchanged state if the entry is submitted
  //     }

  //     // Update the specified field with the new value
  //     entry[field] = value;

  //     // Validate time order before calculating total time
  //     if (isValidTimeOrder(entry.facilityStartTime, entry.facilityLunchStart, entry.facilityLunchEnd, entry.facilityEndTime)) {
  //       // Calculate total time after the update
  //       entry.facilityTotalHours = calculateTotalTime(
  //         entry.facilityStartTime,
  //         entry.facilityLunchStart,
  //         entry.facilityLunchEnd,
  //         entry.facilityEndTime
  //       );
  //     } else {
  //       entry.facilityTotalHours = '0h 0m'; // Reset to 0 if times are not valid
  //     }

  //     if (isValidTimeOrder(entry.drivingStartTime, entry.drivingLunchStart, entry.drivingLunchEnd, entry.drivingEndTime)) {
  //       // Calculate total time for driving work after the update
  //       entry.drivingTotalHours = calculateTotalTime(
  //         entry.drivingStartTime,
  //         entry.drivingLunchStart,
  //         entry.drivingLunchEnd,
  //         entry.drivingEndTime
  //       );
  //     } else {
  //       entry.drivingTotalHours = '0h 0m'; // Reset to 0 if times are not valid
  //     }

  //     console.log('Updated entry after calculation:', entry);

  //     // Ensure status is active if it is not submitted
  //     if (entry.status !== 'submitted') {
  //       entry.status = 'active';
  //     }

  //     // Set the entry to update for the API call
  //     setEntryToUpdate(entry);

  //     return { ...prevState, entries: updatedEntries };
  //   });
  // };

  const handleChange = (index, field, value) => {
    setTimeCard((prevState) => {
      const updatedEntries = [...prevState.entries];
      const entry = updatedEntries[index];
  
      console.log('Current entry before update:', entry);
  
      // Check if the entry is already submitted
      if (entry.status === 'submitted') {
        console.log(`Cannot update entry for date ${entry.date} as it is already submitted.`);
        alert(`You cannot modify the entry for ${moment(entry.date).format('MMMM Do, YYYY')} because it has already been submitted.`);
        return prevState; // Return unchanged state if the entry is submitted
      }
  
      // Update the specified field with the new value
      entry[field] = value;
  
      // Validate time order before calculating total time for Facility
      if (isValidTimeOrder(entry.facilityStartTime, entry.facilityLunchStart, entry.facilityLunchEnd, entry.facilityEndTime)) {
        entry.facilityTotalHours = calculateTotalTime(
          entry.facilityStartTime,
          entry.facilityLunchStart,
          entry.facilityLunchEnd,
          entry.facilityEndTime
        );
      } else {
        entry.facilityTotalHours = '0h 0m';
      }
  
      // Validate time order before calculating total time for Driving
      if (isValidTimeOrder(entry.drivingStartTime, entry.drivingLunchStart, entry.drivingLunchEnd, entry.drivingEndTime)) {
        entry.drivingTotalHours = calculateTotalTime(
          entry.drivingStartTime,
          entry.drivingLunchStart,
          entry.drivingLunchEnd,
          entry.drivingEndTime
        );
      } else {
        entry.drivingTotalHours = '0h 0m';
      }
  
      console.log('Updated entry after calculation:', entry);
  
      // Ensure status is active if it is not submitted
      if (entry.status !== 'submitted') {
        entry.status = 'active';
      }
  
      // Set the entry to update for the API call
      setEntryToUpdate(entry);
  
      return { ...prevState, entries: updatedEntries };
    });
  };


  useEffect(() => {
    if (!entryToUpdate) return; // Exit if there's no entry to update

    // Construct the payload based on the updated entry
    const requestPayload = {
      employee_id: employeeId,
      work_date: entryToUpdate.date,
      facility_start_time: entryToUpdate.facilityStartTime || null,
      facility_lunch_start: entryToUpdate.facilityLunchStart || null,
      facility_lunch_end: entryToUpdate.facilityLunchEnd || null,
      facility_end_time: entryToUpdate.facilityEndTime || null,
      facility_total_hours: entryToUpdate.facilityTotalHours || '0h 0m',
      driving_start_time: entryToUpdate.drivingStartTime || null,
      driving_lunch_start: entryToUpdate.drivingLunchStart || null,
      driving_lunch_end: entryToUpdate.drivingLunchEnd || null,
      driving_end_time: entryToUpdate.drivingEndTime || null,
      driving_total_hours: entryToUpdate.drivingTotalHours || '0h 0m',
      status: entryToUpdate.status || 'active'
    };

    console.log('Request payload for update:', requestPayload);

    const updateEntry = async () => {
      try {
        const response = await fetch(`${API}/timecards/${entryToUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });

        console.log("Fetched data:", response)

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save entry: ${errorText}`);
        }

        const result = await response.json();
        console.log('Response from server:', result);

        // Update local state with the server response
        setTimeCard((prevState) => {
          return {
            ...prevState,
            entries: prevState.entries.map((entry) => {
              if (entry.id === result.data.id) {
                return {
                  ...entry,
                  work_date: result.data.work_date,
                  facility_start_time: result.data.facility_start_time || '',
                  facility_lunch_start: result.data.facility_lunch_start || '',
                  facility_lunch_end: result.data.facility_lunch_end || '',
                  facility_end_time: result.data.facility_end_time || '',
                  facility_total_hours: result.data.facility_total_hours || '0h 0m',
                  driving_start_time: result.data.driving_start_time || '',
                  driving_lunch_start: result.data.driving_lunch_start || '',
                  driving_lunch_end: result.data.driving_lunch_end || '',
                  driving_end_time: result.data.driving_end_time || '',
                  driving_total_hours: result.data.driving_total_hours || '0h 0m',
                  status: result.data.status || 'active'
                };
              }
              return entry;
            }),
          };
        });


        console.log(`Successfully updated timecard with ID ${result.data.id} for date: ${result.data.work_date}`);
      } catch (error) {
        console.error(`Error during PUT operation:`, error);
        alert(`Error saving timecard entry: ${error.message}`);
      }
    };

    updateEntry(); // Call the function to perform the API update

    setEntryToUpdate(null); // Reset after update
  }, [entryToUpdate]); // Run this effect whenever entryToUpdate changes




  const handleSubmit = async () => {
    const twoWeekPeriod = timeCard.entries;
    console.log("Entries before submission:", twoWeekPeriod);

    const alreadySubmittedEntries = twoWeekPeriod.every(entry => entry.status === 'submitted');
    console.log("Checking if all entries are submitted:", alreadySubmittedEntries);

    if (alreadySubmittedEntries) {
      alert("All entries are already submitted.");
      return;
    }

    const requiredFields = ['startTime', 'lunchStart', 'lunchEnd', 'endTime'];

    const incompleteEntries = twoWeekPeriod.filter(entry =>
      requiredFields.some(field => !entry[field] || entry[field].trim() === '')
    );
    console.log("Incomplete entries:", incompleteEntries);

    if (incompleteEntries.length > 0) {
      const confirmation = window.confirm(
        `There are ${incompleteEntries.length} incomplete entries. Do you still want to proceed with submission?`
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
              status: 'submitted',
              work_date: entry.date
            };

            try {
              const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
              });

              if (!response.ok) {
                const errorMessage = await response.text();
                console.error(`Failed to submit entry for ${entry.date}: ${errorMessage}`);
                throw new Error(errorMessage);
              } else {
                console.log(`Successfully updated entry with ID: ${entry.id}`);
              }
            } catch (error) {
              console.error(`Error during PUT operation for date ${entry.date}:`, error);
            }
          }
        })
      );

      console.log('All submissions succeeded. Triggering confetti.');
      setShowConfetti(true);
      setIsSubmitted(true);

      setTimeout(() => {
        setShowConfetti(false);
        console.log('Hiding confetti after 5 seconds');
        setIsNewTimeCardCreated(false);
        afterSubmitReset();
        navigate('/CreatenewTimeCard');
      }, 5000);
    } catch (error) {
      console.error('Unexpected error submitting timecard:', error);
      alert(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleReset = async () => {
    if (timeCard.isSubmitted) {
      alert("Cannot reset a submitted timecard.");
      return;
    }

    const confirmation = window.confirm("Are you sure you want to reset the timecard? All data entered will be lost.");
    if (!confirmation) return;

    try {
      setIsLoading(true); // Set loading state to true before starting the reset process.

      // Deleting entries from the database
      await Promise.all(
        timeCard.entries.map(async (entry) => {
          if (entry.id) {
            const url = `${API}/timecards/${entry.id}`;
            const response = await fetch(url, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
              const errorMessage = await response.text();
              console.error(`Failed to delete entry ID ${entry.id}: ${errorMessage}`);
              throw new Error(errorMessage);
            }
            console.log(`Successfully deleted entry with ID: ${entry.id}`);
          }
        })
      );

      // Reset the timecard state and navigate to create a new timecard
      setTimeCard({ entries: [], isSubmitted: false });
      localStorage.removeItem('currentTimeCard');
      localStorage.removeItem('startDate');
      setIsNewTimeCardCreated(false);
      navigate('/createnewTimeCard');
    } catch (error) {
      console.error('Error deleting entries:', error);
      alert('An error occurred while trying to reset the timecard. Please try again.');
    } finally {
      setIsLoading(false); // Ensure loading state is false after operation is complete.
    }
  };



  const afterSubmitReset = () => {
    setTimeCard({ entries: [], isSubmitted: false });
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
    setIsNewTimeCardCreated(false);
  }


  return (
    <div className={`container mt-5 ${styles.container}`}>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999, // Ensure it's on top of other elements
          }}
        />
      )}

      <div className="text-center mb-3">
        <button
          className="btn btn-primary me-3"
          onClick={handleSubmit}
          disabled={isSubmitting || isSubmitted || isLoading}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Submitting...
            </>
          ) : isSubmitted ? (
            'Submitted'
          ) : (
            'Submit'
          )}
        </button>

        <button
          className="btn btn-danger me-3"
          onClick={handleReset}
          disabled={isSubmitting || isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              Resetting...
            </>
          ) : (
            'Reset'
          )}
        </button>

        <button className="btn btn-secondary" onClick={() => navigate('/createNewTimecard')}>
          Back to Calendar
        </button>
      </div>

      <h2 className="text-center mb-4">Active Timecard</h2>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border custom-spinner" role="status"></div>
          <div className="mt-2">Loading timecard data...</div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Start Time</th>
                <th>Lunch Start</th>
                <th>Activity</th>
                <th>Lunch End</th>
                <th>End Time</th>
                <th>Facility<br/>Total Time</th>
                <th>Driving<br/>Total Time</th>
              </tr>
            </thead>

            <tbody>
              {timeCard.entries.map((entry, index) => (
                <tr key={entry.date}>
                  <td>{moment.utc(entry.date).format('dddd, MMM D, YYYY')}</td>

                  {/* Activity (Morning) */}
                  <td>
                    <select
                      value={entry.morningActivity || 'Facility'}
                      onChange={(e) => handleChange(index, 'morningActivity', e.target.value)}
                      style={{ width: '84px' }} // 30% narrower from 120px to 84px
                    >
                      <option value="Facility">Facility</option>
                      <option value="Driving">Driving</option>
                    </select>
                  </td>

                  {/* Facility or Driving Start Time */}
                  <td>
                    <input
                      type="time"
                      value={entry.activity === 'Facility' ? entry.facilityStartTime : entry.drivingStartTime}
                      onChange={(e) => handleChange(index, entry.activity === 'Facility' ? 'facilityStartTime' : 'drivingStartTime', e.target.value)}
                      onBlur={(e) => validateAMPM(e.target.value, 'startTime')}
                    />
                  </td>

                  {/* Facility or Driving Lunch Start */}
                  <td>
                    <input
                      type="time"
                      value={entry.activity === 'Facility' ? entry.facilityLunchStart : entry.drivingLunchStart}
                      onChange={(e) => handleChange(index, entry.activity === 'Facility' ? 'facilityLunchStart' : 'drivingLunchStart', e.target.value)}
                      onBlur={(e) => validateAMPM(e.target.value, 'lunchStart')}
                    />
                  </td>

                  {/* Activity (Afternoon) */}
                  <td>
                    <select
                      value={entry.afternoonActivity || 'Facility'}
                      onChange={(e) => handleChange(index, 'afternoonActivity', e.target.value)}
                      style={{ width: '84px' }} // 30% narrower from 120px to 84px
                    >
                      <option value="Facility">Facility</option>
                      <option value="Driving">Driving</option>
                    </select>
                  </td>

                  {/* Facility or Driving Lunch End */}
                  <td>
                    <input
                      type="time"
                      value={entry.activity === 'Facility' ? entry.facilityLunchEnd : entry.drivingLunchEnd}
                      onChange={(e) => handleChange(index, entry.activity === 'Facility' ? 'facilityLunchEnd' : 'drivingLunchEnd', e.target.value)}
                      onBlur={(e) => validateAMPM(e.target.value, 'lunchEnd')}
                    />
                  </td>

                  {/* Facility or Driving End Time */}
                  <td>
                    <input
                      type="time"
                      value={entry.activity === 'Facility' ? entry.facilityEndTime : entry.drivingEndTime}
                      onChange={(e) => handleChange(index, entry.activity === 'Facility' ? 'facilityEndTime' : 'drivingEndTime', e.target.value)}
                      onBlur={(e) => validateAMPM(e.target.value, 'endTime')}
                    />
                  </td>

                  {/* Facility Total Time */}
                  <td>{entry.facilityTotalHours}</td>
                  {/* Driving Total Time */}
                  <td>{entry.drivingTotalHours}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={7} style={{ textAlign: 'right' }}>
                  <strong>Total Time:</strong>
                </td>
                <td>{calculateTotalTimeForAllEntries().split(' / ')[0]}</td>
                <td>{calculateTotalTimeForAllEntries().split(' / ')[1]}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

}

export default ActiveTimeCard;




  // // New function to calculate total time for all entries
  // const calculateTotalTimeForAllEntries = () => {
  //   let totalMinutes = 0;

  //   timeCard.entries.forEach((entry) => {
  //     const facilityMinutes = entry.facilityTotalHours || 0;
  //     const drivingMinutes = entry.drivingTotalHours || 0;

  //     totalMinutes += facilityMinutes + drivingMinutes;
  //   });

  //   const totalHours = Math.floor(totalMinutes / 60);
  //   const remainingMinutes = totalMinutes % 60;
  //   return `${isNaN(totalHours) ? 0 : totalHours}h ${isNaN(remainingMinutes) ? 0 : remainingMinutes}m`;

  // };


// return (
//   <div className={`container mt-5 ${styles.container}`}>
//     {showConfetti && (
//       <Confetti
//         width={width}
//         height={height}
//         style={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           zIndex: 9999, // Ensure it's on top of other elements
//         }}
//       />
//     )}

//     <div className="text-center mb-3">
//       {/* Submit Button with Conditional Label */}
//       <button
//         className="btn btn-primary me-3"
//         onClick={handleSubmit}
//         disabled={isSubmitting || isSubmitted || isLoading} // Disable if submitting, submitted, or loading
//       >
//         {isSubmitting ? (
//           <>
//             <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//             Submitting...
//           </>
//         ) : isSubmitted ? (
//           'Submitted'
//         ) : (
//           'Submit'
//         )}
//       </button>

//       {/* Reset Button - Optionally disable during submission */}
//       <button
//         className="btn btn-danger me-3"
//         onClick={handleReset}
//         disabled={isSubmitting || isLoading} // Disable if submitting or loading
//       >
//         {isLoading ? (
//           <>
//             <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
//             Resetting...
//           </>
//         ) : (
//           'Reset'
//         )}
//       </button>

//       {/* Back to Calendar Button */}
//       <button className="btn btn-secondary" onClick={() => navigate('/createNewTimecard')}>Back to Calendar</button>
//     </div>

//     <h2 className="text-center mb-4">Active Timecard</h2>

//     {isLoading ? (
//       <div className="text-center">
//         <div className="spinner-border custom-spinner" role="status">
//         </div>
//         <div className="mt-2">Loading timecard data...</div>
//       </div>
//     ) : (
//       <div className="table-responsive">
//         <table className="table table-bordered">
//           <thead>
//             <tr>
//               <th>Date</th>
//               <th>Start Time</th>
//               <th>Lunch Start</th>
//               <th>Lunch End</th>
//               <th>End Time</th>
//               <th>Total Time</th>
//             </tr>
//           </thead>

//           <tbody>
//             {timeCard.entries.map((entry, index) => (
//               <tr key={entry.date}>
//                 {/* <td>{formatDate(entry.date)}</td> */}
//                 <td>{moment.utc(entry.date).format('dddd, MMM D, YYYY')}</td>
//                 <td>
//                   <input
//                     type="time"
//                     value={entry.startTime}
//                     onChange={(e) => {
//                       handleChange(index, 'startTime', e.target.value);
//                       validateAMPM(e.target.value, 'startTime'); // Call validation here for mobile users
//                     }}
//                   onBlur={(e) => validateAMPM(e.target.value, 'startTime')}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="time"
//                     value={entry.lunchStart}
//                     onChange={(e) => {
//                       handleChange(index, 'lunchStart', e.target.value);
//                       validateAMPM(e.target.value, 'lunchStart');
//                     }}
//                   onBlur={(e) => validateAMPM(e.target.value, 'lunchStart')}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="time"
//                     value={entry.lunchEnd}
//                     onChange={(e) => {
//                       handleChange(index, 'lunchEnd', e.target.value);
//                       // validateAMPM(e.target.value, 'lunchEnd');
//                     }}
//                   onBlur={(e) => validateAMPM(e.target.value, 'lunchEnd')}
//                   />
//                 </td>
//                 <td>
//                   <input
//                     type="time"
//                     value={entry.endTime}
//                     onChange={(e) => {
//                       handleChange(index, 'endTime', e.target.value);
//                       validateAMPM(e.target.value, 'endTime');
//                     }}
//                   onBlur={(e) => validateAMPM(e.target.value, 'endTime')}
//                   />
//                 </td>
//                 <td>{entry.totalTime}</td>
//               </tr>
//             ))}
//             <tr>
//               <td colSpan={5} style={{ textAlign: 'right' }}><strong>Total Time:</strong></td>
//               <td>{calculateTotalTimeForAllEntries()}</td>
//             </tr>
//           </tbody>

//         </table>
//       </div>
//     )}

//   </div>
// );

