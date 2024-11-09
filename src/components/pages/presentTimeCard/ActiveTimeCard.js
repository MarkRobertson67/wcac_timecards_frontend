
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
        const totalTime = entry.total_time ? `${entry.total_time.hours}h ${entry.total_time.minutes}m` : '0h 0m';
        fetchedEntriesMap.set(date, {
          id: entry.id,
          date,
          startTime: entry.start_time || '',
          lunchStart: entry.lunch_start || '',
          lunchEnd: entry.lunch_end || '',
          endTime: entry.end_time || '',
          totalTime,
          status: entry.status || 'active',
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
          start_time: '',
          lunch_start: '',
          lunch_end: '',
          end_time: '',
          total_time: '',
          status: 'active',
          employee_id: employeeId,
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
            startTime: savedEntry.data.start_time || '',
            lunchStart: savedEntry.data.lunch_start || '',
            lunchEnd: savedEntry.data.lunch_end || '',
            endTime: savedEntry.data.end_time || '',
            totalTime: savedEntry.data.total_time || '0h 0m',
            status: savedEntry.data.status || 'active',
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



  const calculateTotalTime = (start, lunchStart, lunchEnd, end) => {
    const parseTime = (time) => (time ? moment(time, 'HH:mm') : null);
    const startTime = parseTime(start);
    const lunchStartTime = parseTime(lunchStart);
    const lunchEndTime = parseTime(lunchEnd);
    const endTime = parseTime(end);

    let totalMinutes = 0;

    if (startTime && lunchStartTime) {
      const duration = (lunchStartTime - startTime) / (1000 * 60);
      totalMinutes += Math.max(duration, 0); // Ensure no negative values
    }

    if (lunchEndTime && endTime) {
      const duration = (endTime - lunchEndTime) / (1000 * 60);
      totalMinutes += Math.max(duration, 0); 
    }

    if (startTime && endTime && !lunchStartTime && !lunchEndTime) {
      const duration = (endTime - startTime) / (1000 * 60);
      totalMinutes += Math.max(duration, 0); 
    }

    if (startTime && lunchStartTime && lunchEndTime && !endTime) {
      const duration = (lunchStartTime - startTime) / (1000 * 60);
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


          // Validate time order before calculating total time
    if (isValidTimeOrder(entry.startTime, entry.lunchStart, entry.lunchEnd, entry.endTime)) {
      // Calculate total time after the update
      entry.totalTime = calculateTotalTime(
        entry.startTime,
        entry.lunchStart,
        entry.lunchEnd,
        entry.endTime
      );
    } else {
      entry.totalTime = '0h 0m'; // Reset to 0 if times are not valid
    }


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
        {/* Submit Button with Conditional Label */}
        <button
          className="btn btn-primary me-3"
          onClick={handleSubmit}
          disabled={isSubmitting || isSubmitted || isLoading} // Disable if submitting, submitted, or loading
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
          disabled={isSubmitting || isLoading} // Disable if submitting or loading
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

        {/* Back to Calendar Button */}
        <button className="btn btn-secondary" onClick={() => navigate('/createNewTimecard')}>Back to Calendar</button>
      </div>

      <h2 className="text-center mb-4">Active Timecard</h2>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border custom-spinner" role="status">
          </div>
          <div className="mt-2">Loading timecard data...</div>
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
              {timeCard.entries.map((entry, index) => (
                <tr key={entry.date}>
                  {/* <td>{formatDate(entry.date)}</td> */}
                  <td>{moment.utc(entry.date).format('dddd, MMM D, YYYY')}</td>
                  <td>
                    <input
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => {
                        handleChange(index, 'startTime', e.target.value);
                        validateAMPM(e.target.value, 'startTime'); // Call validation here for mobile users
                      }}
                    onBlur={(e) => validateAMPM(e.target.value, 'startTime')}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={entry.lunchStart}
                      onChange={(e) => {
                        handleChange(index, 'lunchStart', e.target.value);
                        validateAMPM(e.target.value, 'lunchStart');
                      }}
                    onBlur={(e) => validateAMPM(e.target.value, 'lunchStart')}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={entry.lunchEnd}
                      onChange={(e) => {
                        handleChange(index, 'lunchEnd', e.target.value);
                        // validateAMPM(e.target.value, 'lunchEnd');
                      }}
                    onBlur={(e) => validateAMPM(e.target.value, 'lunchEnd')}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => {
                        handleChange(index, 'endTime', e.target.value);
                        validateAMPM(e.target.value, 'endTime');
                      }}
                    onBlur={(e) => validateAMPM(e.target.value, 'endTime')}
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
//       <button
//         className="btn btn-primary me-3"
//         onClick={handleSubmit}
//         disabled={isSubmitting || isSubmitted || isLoading}
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

//       <button
//         className="btn btn-danger me-3"
//         onClick={handleReset}
//         disabled={isSubmitting || isLoading}
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

//       <button className="btn btn-secondary" onClick={() => navigate('/createNewTimecard')}>
//         Back to Calendar
//       </button>
//     </div>

//     <h2 className="text-center mb-4">Active Timecard</h2>

//     {isLoading ? (
//       <div className="text-center">
//         <div className="spinner-border custom-spinner" role="status"></div>
//         <div className="mt-2">Loading timecard data...</div>
//       </div>
//     ) : (
//       <div className="table-responsive">
//         <table className="table table-bordered">
//           <thead>
//             <tr>
//               <th>Date</th>
//               <th>Activity</th>
//               <th>Start Time</th>
//               <th>Lunch Start</th>
//               <th>Activity</th>
//               <th>Lunch End</th>
//               <th>End Time</th>
//               <th>Total Time</th>
//             </tr>
//           </thead>

//           <tbody>
//             {timeCard.entries.map((entry, index) => (
//               <tr key={entry.date}>
//                 <td>{moment.utc(entry.date).format('dddd, MMM D, YYYY')}</td>

//                 {/* Activity (First Activity) */}
//                 <td>
//                   <select
//                     value={entry.morningActivity || 'Facility'}
//                     onChange={(e) => handleChange(index, 'morningActivity', e.target.value)}
//                     style={{ width: '84px' }} // 30% narrower from 120px to 84px
//                   >
//                     <option value="Facility">Facility</option>
//                     <option value="Driving">Driving</option>
//                   </select>
//                 </td>

//                 {/* Start Time */}
//                 <td>
//                   <input
//                     type="time"
//                     value={entry.startTime}
//                     onChange={(e) => handleChange(index, 'startTime', e.target.value)}
//                     onBlur={(e) => validateAMPM(e.target.value, 'startTime')}
//                   />
//                 </td>

//                 {/* Lunch Start */}
//                 <td>
//                   <input
//                     type="time"
//                     value={entry.lunchStart}
//                     onChange={(e) => handleChange(index, 'lunchStart', e.target.value)}
//                     onBlur={(e) => validateAMPM(e.target.value, 'lunchStart')}
//                   />
//                 </td>

//                 {/* Activity (Second Activity) */}
//                 <td>
//                   <select
//                     value={entry.afternoonActivity || 'Facility'}
//                     onChange={(e) => handleChange(index, 'afternoonActivity', e.target.value)}
//                     style={{ width: '84px' }} // 30% narrower from 120px to 84px
//                   >
//                     <option value="Facility">Facility</option>
//                     <option value="Driving">Driving</option>
//                   </select>
//                 </td>

//                 {/* Lunch End */}
//                 <td>
//                   <input
//                     type="time"
//                     value={entry.lunchEnd}
//                     onChange={(e) => handleChange(index, 'lunchEnd', e.target.value)}
//                     onBlur={(e) => validateAMPM(e.target.value, 'lunchEnd')}
//                   />
//                 </td>

//                 {/* End Time */}
//                 <td>
//                   <input
//                     type="time"
//                     value={entry.endTime}
//                     onChange={(e) => handleChange(index, 'endTime', e.target.value)}
//                     onBlur={(e) => validateAMPM(e.target.value, 'endTime')}
//                   />
//                 </td>

//                 {/* Total Time */}
//                 <td>{entry.totalTime}</td>
//               </tr>
//             ))}
//             <tr>
//               <td colSpan={7} style={{ textAlign: 'right' }}>
//                 <strong>Total Time:</strong>
//               </td>
//               <td>{calculateTotalTimeForAllEntries()}</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//     )}
//   </div>
// );