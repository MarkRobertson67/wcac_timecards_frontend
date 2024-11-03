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
      const adjustedStartDate = getPreviousMonday(startDate);
      const endDate = getEndDate(adjustedStartDate);

      console.log("Adjusted Start Date:", adjustedStartDate.format());
      console.log("End Date for fetching:", endDate.format());

      const formattedStart = moment.utc(adjustedStartDate).format('YYYY-MM-DD');
      const formattedEnd = moment.utc(endDate).format('YYYY-MM-DD');
      console.log("Fetching data from", formattedStart, "to", formattedEnd);

      // Fetch existing entries from the backend
      const response = await fetch(`${API}/timecards/employee/${employeeId}/range/${formattedStart}/${formattedEnd}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const fetchedData = await response.json();
      console.log("Fetched data:", fetchedData);

      // Generate the list of all weekdays in the 2-week period
      let allWeekdays = [];
      let currentDate = getPreviousMonday(startDate);
      for (let i = 0; i < 14; i++) {
        if (isWeekday(currentDate)) {
          allWeekdays.push(currentDate.clone());
        }
        currentDate.add(1, 'day');
      }
      console.log("All Weekdays in 2-week period:", allWeekdays.map(d => d.format('YYYY-MM-DD')));

      // Map fetched entries by date for quick lookup
      const fetchedEntriesMap = new Map();
      fetchedData.data.forEach(entry => {
        const date = moment.utc(entry.work_date).format('YYYY-MM-DD');

        // Convert total_time from object to string
        const totalTime = entry.total_time
          ? `${entry.total_time.hours}h ${entry.total_time.minutes}m`
          : '0h 0m';

        fetchedEntriesMap.set(date, {
          id: entry.id,
          date: date,
          startTime: entry.start_time || '',
          lunchStart: entry.lunch_start || '',
          lunchEnd: entry.lunch_end || '',
          endTime: entry.end_time || '',
          totalTime,
          status: entry.status || 'active',

        });
        console.log(`Setting date for entry ID ${entry.id}:`, date);

      });

      console.log("Fetched Entries Map:", fetchedEntriesMap);

      // Determine missing dates
      const missingDates = allWeekdays
        .map(date => date.format('YYYY-MM-DD'))
        .filter(date => !fetchedEntriesMap.has(date));
      console.log("Missing Dates:", missingDates);

      // Create missing entries via POST requests
      const createdEntriesPromises = missingDates.map(async (date) => {
        const newEntrySnakeCase = {
          work_date: date,
          start_time: '',
          lunch_start: '',
          lunch_end: '',
          end_time: '',
          total_time: '',
          status: 'active',
          employee_id: employeeId,
        };

        console.log(`Creating new entry for ${employeeId} for ${date}:`, newEntrySnakeCase);

        try {
          const postResponse = await fetch(`${API}/timecards`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newEntrySnakeCase),
          });

          console.log(`POST request sent for ${date}. Status: ${postResponse.status}`);

          if (!postResponse.ok) {
            const errorText = await postResponse.text();
            console.error(`Failed to create entry for ${date}:`, errorText);
            throw new Error(`Failed to create entry for ${date}: ${errorText}`);
          }

          const savedEntry = await postResponse.json();
          console.log(`New entry created with ID: ${savedEntry.data.id} for ${date}`);

          // Map the saved entry to camelCase
          const savedEntryCamelCase = {
            id: savedEntry.data.id,
            date: savedEntry.data.work_date,
            startTime: savedEntry.data.start_time || '',
            lunchStart: savedEntry.data.lunch_start || '',
            lunchEnd: savedEntry.data.lunch_end || '',
            endTime: savedEntry.data.end_time || '',
            totalTime: savedEntry.data.total_time || '0h 0m',
            status: savedEntry.data.status || 'active',
          };

          console.log(`Mapped Saved Entry for ${date}:`, savedEntryCamelCase);

          return savedEntryCamelCase;
        } catch (error) {
          console.error(`Error creating entry for ${date}:`, error);
          return null;
        }
      });

      // Wait for all POST requests to complete
      const createdEntriesResults = await Promise.all(createdEntriesPromises);
      console.log("All POST requests completed.");

      // Filter out any failed creations
      const successfulCreatedEntries = createdEntriesResults.filter(entry => entry !== null);
      console.log(`Successfully created ${successfulCreatedEntries.length} new entr${successfulCreatedEntries.length === 1 ? 'y' : 'ies'}.`);

      // Combine fetched entries and created entries
      const allEntries = [
        ...Array.from(fetchedEntriesMap.values()),
        ...successfulCreatedEntries,
      ];

      console.log("All Entries to be set in state:", allEntries);


      // Fetch all timecards again to ensure the latest data
      const allResponse = await fetch(`${API}/timecards/employee/${employeeId}/range/${formattedStart}/${formattedEnd}`);
      if (!allResponse.ok) {
        throw new Error(`HTTP error! status: ${allResponse.status}`);
      }



      // Update state with all entries...
      setTimeCard({ entries: allEntries, isSubmitted: false });
    } catch (error) {
      console.error('Error fetching timecard data:', error);
      setTimeCard({ entries: [], isSubmitted: false });
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);



  useEffect(() => {
    if (hasFetched.current) return; // Exit early if already fetched

    const fetchData = async () => {
      hasFetched.current = true; // Set the flag after fetching
      const storedStartDateStr = localStorage.getItem('startDate');
      const startDate = storedStartDateStr ? new Date(storedStartDateStr) : new Date();
      console.log("Start Date for fetching:", startDate.toISOString());

      const previousMonday = getPreviousMonday(startDate); // Adjust to previous Monday
      console.log("Previous Monday for fetching:", previousMonday.toISOString());
      await fetchTimeCardData(previousMonday);
    };

    fetchData();
  }, [fetchTimeCardData]);


  // This useEffect should be carefully managed to avoid infinite loops
  useEffect(() => {
    if (!timeCard.entries.length) return; // Prevent fetching if entries are empty

    const fetchData = async () => {
      await fetchTimeCardData(getPreviousMonday(new Date())); // Use current date to fetch new data
    };

    fetchData();
  }, [timeCard.entries.length, fetchTimeCardData]); // Only react when the length of entries changes


  const calculateTotalTime = (start, lunchStart, lunchEnd, end) => {

    const parseTime = (time) => (time ? moment(time, 'HH:mm') : null);
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
    console.log('Calculated Total Time:', totalTime);
    return totalTime || '00:00';
  };

  const isWeekday = (date) => {
    const day = moment(date).day();
    return day !== 0 && day !== 6; // Not Sunday (0) or Saturday (6)
  };

  // New function to calculate total time for all entries
  const calculateTotalTimeForAllEntries = () => {
    let totalMinutes = 0;

    timeCard.entries.forEach((entry) => {
      // Calculate each entry's total time using the existing function
      const totalTimeParts = entry.totalTime.split('h');
      const hours = parseInt(totalTimeParts[0], 10) || 0;
      const minutes = parseInt(totalTimeParts[1], 10) || 0;

      totalMinutes += hours * 60 + minutes;
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${totalHours}h ${remainingMinutes}m`;
  };


  const handleChange = (index, field, value) => {
    setTimeCard((prevState) => {
      const updatedEntries = [...prevState.entries];
      const entry = updatedEntries[index];

      console.log('Current entry:', entry);

      // Check if the entry is already submitted
      if (entry.status === 'submitted') {
        console.log(`Cannot update entry for date ${entry.date} as it is already submitted.`);
        alert(`You cannot modify the entry for ${moment(entry.date).format('MMMM Do, YYYY')} because it has already been submitted.`);
        return prevState; // Return unchanged state if the entry is submitted
      }


      // Update the specified field with the new value
      entry[field] = value;

      // Calculate total time after the update
      entry.totalTime = calculateTotalTime(
        entry.startTime,
        entry.lunchStart,
        entry.lunchEnd,
        entry.endTime
      );

      entry.status = 'active'; // Ensure status is active

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
      start_time: entryToUpdate.startTime || null,
      lunch_start: entryToUpdate.lunchStart || null,
      lunch_end: entryToUpdate.lunchEnd || null,
      end_time: entryToUpdate.endTime || null,
      total_time: entryToUpdate.totalTime || '0h 0m',
      status: entryToUpdate.status || 'active',
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
                  start_time: result.data.start_time || '',
                  lunch_start: result.data.lunch_start || '',
                  lunch_end: result.data.lunch_end || '',
                  end_time: result.data.end_time || '',
                  total_time: result.data.total_time || '0h 0m',
                  status: result.data.status || 'active',

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

    // Check if all entries are already submitted
    const alreadySubmittedEntries = twoWeekPeriod.every(entry => entry.status === 'submitted');
    console.log("Checking if all entries are submitted:", alreadySubmittedEntries);

    if (alreadySubmittedEntries) {
      alert("All entries are already submitted.");
      return;  // Prevent resubmission if everything is already submitted
    }

    // Define required fields
    const requiredFields = ['startTime', 'lunchStart', 'lunchEnd', 'endTime'];

    // Check for entries with missing required fields
    const incompleteEntries = twoWeekPeriod.filter(entry =>
      requiredFields.some(field => !entry[field] || entry[field].trim() === '')
    );
    console.log("Incomplete entries:", incompleteEntries);


    if (incompleteEntries.length > 0) {
      const confirmation = window.confirm(
        `There are ${incompleteEntries.length} missing days. Click 'Cancel' to create them first, or 'OK' to ignore blank entries and proceed with the submission.`
      );

      if (!confirmation) {
        console.log("User canceled submission due to missing fields.");
        return;  // Halt the submission process
      }
      // If user confirms, proceed with submission
    }

    try {
      setIsSubmitting(true); // **Set submitting state to true**
      console.log("Submitting timecard...");
      console.log("isSubmitting state in handleReset:", isSubmitting);

      // Array to keep track of failed submissions
      const failedSubmissions = [];

      // Iterate through all entries and submit them
      await Promise.all(
        twoWeekPeriod.map(async (entry) => {
          // Log the date and ID for each entry in the two-week period
          // Ensure the entry has a valid date before submitting
          const entryDate = entry.date || 'No date found'; // Adjusted to log the date

          console.log(`Processing entry for date: ${entryDate}, ID: ${entry.id ? entry.id : 'No ID assigned yet'}`);

          console.log(`Date: ${entryDate}, ID: ${entry.id ? entry.id : 'No ID assigned yet'}`);

          if (entry.id) {
            // Only submit if the entry has an ID
            const url = `${API}/timecards/${entry.id}`;
            const requestPayload = {
              status: 'submitted',  // Always set status to 'submitted'
              work_date: entryDate // Ensure the work date is included in the payload
            };

            console.log(`Submitting PUT request for date ${entryDate}`);

            try {
              const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
              });

              if (!response.ok) {
                const errorMessage = await response.text();
                console.error(`Failed to submit entry for ${entryDate}: ${errorMessage}`);
                throw new Error(errorMessage);
              } else {
                console.log(`Successfully updated entry with ID: ${entry.id}`);
              }
            } catch (error) {
              console.error(`Error during PUT operation for date ${entryDate}:`, error);
              failedSubmissions.push(entryDate);  // Add the date to failed submissions
            }
          }
        })
      );

      // Determine the outcome based on failed submissions
      if (failedSubmissions.length === 0) {
        // All submissions succeeded
        console.log('All submissions succeeded. Triggering confetti.');
        setShowConfetti(true); // Trigger confetti
        setIsSubmitted(true);   // Update button label to "Submitted"
        console.log("Timecard submitted, current submitted state:", isSubmitted);


        // Hide confetti after 5 seconds and navigate
        setTimeout(() => {
          setShowConfetti(false);
          console.log('Hiding confetti after 5 seconds');

          // Proceed with state reset and navigation
          setIsNewTimeCardCreated(false);
          afterSubmitReset();  // Reset the timecard after submission
          navigate('/');
        }, 5000); // 5000 milliseconds = 5 seconds
      } else if (failedSubmissions.length === twoWeekPeriod.length) {
        // All submissions failed
        alert('Failed to submit the timecard. Please try again later.');
        console.log('All submissions failed.');
      } else {
        // Partial failures
        const failedDatesFormatted = failedSubmissions.map(date => moment(date).format('MMMM Do YYYY')).join(', ');
        alert(`Timecard submitted with errors. Failed to submit entries for the following dates:\n${failedDatesFormatted}`);
        console.log(`Partial failures for dates: ${failedDatesFormatted}`);
      }

      console.log('Timecard submission process completed.');
    } catch (error) {
      console.error('Unexpected error submitting timecard:', error);
      alert(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false); // **Set submitting state to false**
    }
  };


  const handleReset = async () => { //Add here code to delete the entries made.
    console.log("Current timeCard submitted state:", timeCard.isSubmitted);

    // Check if all entries are already submitted
    const alreadySubmittedEntries = timeCard.entries.every(entry => entry.status === 'submitted');
    console.log("Checking if all entries are submitted:", alreadySubmittedEntries);

    // Alert if all entries are submitted
    if (alreadySubmittedEntries) {
      alert("You cannot reset the timecard because all entries have already been submitted.");
      return; // Exit the function to prevent reset
    }

    if (timeCard.isSubmitted) {
      alert("You cannot reset the timecard because it has already been submitted.");
      return; // Exit the function to prevent reset
    }

    const isConfirmed = window.confirm("Are you sure you want to reset? All data entered will be lost.");
    if (!isConfirmed) return;

    try {
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

      // Proceed to reset the timecard
      setTimeCard({ entries: [], isSubmitted: false });
      localStorage.removeItem('currentTimeCard');
      localStorage.removeItem('startDate');
      setIsNewTimeCardCreated(false);
      navigate('/createNewTimeCard');
    } catch (error) {
      console.error('Error deleting entries:', error);
      alert('An error occurred while trying to reset the timecard. Please try again.');
    }
  };



  const afterSubmitReset = () => {
    setTimeCard({ entries: [], isSubmitted: false });
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
    setIsNewTimeCardCreated(false);
  }



  const handleBack = () => {
    navigate('/createNewTimecard');
  };



  const filteredEntries = timeCard.entries.filter((entry) => isWeekday(entry.date));


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
        {/* Submit Button with Conditional Label */}
        <button
          className="btn btn-primary me-3"
          onClick={handleSubmit}
          disabled={isSubmitting || isSubmitted} // Disable when submitting or after submission
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

        {/* Reset Button - Optionally disable during submission */}
        <button
          className="btn btn-danger me-3"
          onClick={handleReset}
          disabled={isSubmitting} // disable during submission
        >
          Reset
        </button>

        {/* Back to Calendar Button */}
        <button className="btn btn-secondary" onClick={handleBack}>Back to Calendar</button>
      </div>

      <h2 className="text-center mb-4">Active Timecard</h2>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border custom-spinner" role="status">
            <span className="visually-hidden">Loading timecard data...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Date</th>
                <th>Start Time</th>
                <th>Lunch Start</th>
                <th>Lunch End</th>
                <th>End Time</th>
                <th>Total Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, index) => (
                <tr key={entry.date}>
                  {/* <td>{formatDate(entry.date)}</td> */}
                  <td>{moment.utc(entry.date).format('dddd, MMM D, YYYY')}</td>
                  <td>
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => handleChange(index, 'startTime', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={entry.lunchStart}
                      onChange={(e) => handleChange(index, 'lunchStart', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={entry.lunchEnd}
                      onChange={(e) => handleChange(index, 'lunchEnd', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => handleChange(index, 'endTime', e.target.value)}
                      required
                    />
                  </td>
                  <td>{entry.totalTime}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} style={{ textAlign: 'right' }}><strong>Total Time:</strong></td>
                <td>{calculateTotalTimeForAllEntries()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

    </div>
  );

}

export default ActiveTimeCard;
