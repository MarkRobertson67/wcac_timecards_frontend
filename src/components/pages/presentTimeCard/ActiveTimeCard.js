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
console.log('Window Size:', width, height);


const getPreviousMonday = (date) => {
  const day = moment(date).day();
  if (day === 1) { // If the day is Monday (1)
    return moment(date); // Return the same date
  } else if (day === 0) { // If the day is Sunday (0)
    return moment(date).add(1, 'days'); // Move to Monday
  } else {
    return moment(date).startOf('week').add(1, 'days'); // Start of the week is Sunday, get Monday
  }
};


  const getEndDate = (startDate) => {
    return moment(startDate).add(13, 'days'); // Two-week period
  };

  
  const fetchTimeCardData = useCallback(async (startDate) => {
    try {
      const adjustedStartDate = getPreviousMonday(startDate);
      const endDate = getEndDate(adjustedStartDate);
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
            date: savedEntry.data.work_date, // Assuming 'work_date' is returned
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
          return null; // Optionally handle or retry
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

      // Update state with all entries
      setTimeCard({ entries: allEntries, isSubmitted: false });
      console.log("Updated TimeCard entries:", allEntries);
    } catch (error) {
      console.error('Error fetching timecard data:', error);
      // Maybe retry fetching or handle the error differently
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
      const startDate = storedStartDateStr ? moment.utc(storedStartDateStr) : moment.utc();
      await fetchTimeCardData(startDate);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const calculateTotalTime = (start, lunchStart, lunchEnd, end) => {

    const parseTime = (time) => (time ? moment.utc(time, 'HH:mm:ss') : null);
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

  const handleChange = async (index, field, value) => {
    console.log(`handleChange called for index: ${index}, field: ${field}, value: ${value}`);

    // Store the previous value for potential rollback in case of an error
    let previousValue;

    // Update the local state first
    setTimeCard((prevState) => {
      const entries = [...prevState.entries];
      const entryToUpdate = entries.find((e, idx) => isWeekday(e.date) && idx === index);

      if (!entryToUpdate || entryToUpdate.status === 'submitted') {
        alert('Cannot update a submitted timecard');
        return prevState;
      }

      // Store the previous value before updating
      previousValue = entryToUpdate[field];

      // Update the specified field with the new value
      entryToUpdate[field] = value;

      // Recalculate total time based on updated fields
      entryToUpdate.totalTime = calculateTotalTime(
        entryToUpdate.startTime,
        entryToUpdate.lunchStart,
        entryToUpdate.lunchEnd,
        entryToUpdate.endTime
      );

      // Ensure the status is set to 'active' if not already 'submitted'
      if (entryToUpdate.status !== 'submitted') {
        entryToUpdate.status = 'active';
      }

      console.log(`Updating entry: PUT method`);
      console.log('Updated entry before saving:', entryToUpdate);

      return { ...prevState, entries };
    });

    // Retrieve the updated entry from the new state
    const updatedEntry = timeCard.entries.find((e, idx) => isWeekday(e.date) && idx === index);

    if (!updatedEntry) {
      console.error('Entry not found after state update');
      return;
    }

    // Perform the database update using PUT
    try {
      const method = 'PUT'; // Always using PUT
      const url = `${API}/timecards/${updatedEntry.id}`;

      const requestPayload = {
        employee_id: employeeId,
        work_date: updatedEntry.date,
        start_time: updatedEntry.startTime || null,
        lunch_start: updatedEntry.lunchStart || null,
        lunch_end: updatedEntry.lunchEnd || null,
        end_time: updatedEntry.endTime || null,
        total_time: updatedEntry.totalTime || '',
        status: updatedEntry.status || 'active',
      };

      console.log(`Updating entry in database for index: ${index}, using ${method} method`);
      console.log('Request payload:', requestPayload);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save entry: ${errorText}`);
      }

      const result = await response.json();
      console.log('Response from server:', result);

      console.log(`Successfully updated timecard with ID ${result.data.id}`);
    } catch (error) {
      console.error(`Error during PUT operation:`, error);
      alert(`Error saving timecard entry: ${error.message}`);

      // Revert the local state change if the API call fails
      setTimeCard((prevState) => {
        const entries = [...prevState.entries];
        const entryToRevert = entries.find((e, idx) => isWeekday(e.date) && idx === index);
        if (entryToRevert) {
          entryToRevert[field] = previousValue;
          entryToRevert.totalTime = calculateTotalTime(
            entryToRevert.startTime,
            entryToRevert.lunchStart,
            entryToRevert.lunchEnd,
            entryToRevert.endTime
          );
        }
        return { ...prevState, entries };
      });
    }
  };


  const handleSubmit = async () => {
    const twoWeekPeriod = timeCard.entries;

    // Check if all entries are already submitted
    const alreadySubmittedEntries = twoWeekPeriod.every(entry => entry.status === 'submitted');

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

    if (incompleteEntries.length > 0) {
      const confirmation = window.confirm(
        `There are ${incompleteEntries.length} missing days. Click 'Cancel' to create them first, or 'OK' to ignore blank entries and proceed with the submission.`
      );

      if (!confirmation) {
        // User chose to cancel the submission
        return;  // Halt the submission process
      }
      // If user confirms, proceed with submission
    }

    try {
      setIsSubmitting(true); // **Set submitting state to true**

      // Array to keep track of failed submissions
      const failedSubmissions = [];

      // Iterate through all entries and submit them
      await Promise.all(
        twoWeekPeriod.map(async (entry) => {
          // Log the date and ID for each entry in the two-week period
          console.log(`Date: ${entry.work_date}, ID: ${entry.id ? entry.id : 'No ID assigned yet'}`);

          if (entry.id) {
            // Only submit if the entry has an ID
            const url = `${API}/timecards/${entry.id}`;
            const requestPayload = {
              status: 'submitted',  // Always set status to 'submitted'
            };

            console.log(`Submitting PUT request for date ${entry.work_date}`);

            try {
              const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload),
              });

              if (!response.ok) {
                const errorMessage = await response.text();
                console.error(`Failed to submit entry for ${entry.work_date}: ${errorMessage}`);
                throw new Error(errorMessage);
              } else {
                console.log(`Successfully updated entry with ID: ${entry.id}`);
              }
            } catch (error) {
              console.error(`Error during PUT operation for date ${entry.work_date}:`, error);
              failedSubmissions.push(entry.work_date);  // Add the date to failed submissions
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
        const failedDatesFormatted = failedSubmissions.map(date => moment.utc(date).format('MMMM Do YYYY')).join(', ');
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

  const handleReset = () => { //Add here code to delete the entries made.
    const isConfirmed = window.confirm("Are you sure you want to reset? All data entered will be lost.");
    if (!isConfirmed) return;

    setTimeCard({ entries: [], isSubmitted: false });
    localStorage.removeItem('currentTimeCard');
    localStorage.removeItem('startDate');
    setIsNewTimeCardCreated(false);
    navigate('/createNewTimeCard');
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
          <p>Loading timecard data...</p>
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
    
}

export default ActiveTimeCard;
