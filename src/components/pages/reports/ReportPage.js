// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDate, formatTime } from "../utils/TimeAndDateUtils";
import styles from "./ReportPage.module.css";

// const API = process.env.REACT_APP_API_URL;

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    reportType,
    startDate,
    endDate,
    employeeId,
    firstName,
    lastName,
    reportData: initialReportData,
  } = location.state || {};
  console.log("Initial Report Data:", initialReportData);

  // State for toggling periods
  const [period, setPeriod] = useState("weekly"); // 'weekly', 'monthly', or 'yearly'
  const [reportData, setReportData] = useState(initialReportData || []); //Use passed datathrough location.state
  const [loading, setLoading] = useState(false);
  const [cachedData, setCachedData] = useState({}); // Cache data for periods

  // Helper function to calculate the overall totals for detailed timecards
const calculateTotalsForDetailedTimecards = () => {
  let totalFacilityMinutes = 0;
  let totalDrivingMinutes = 0;

  reportData.forEach((record) => {
    if (record.facility_total_hours) {
      totalFacilityMinutes +=
        record.facility_total_hours.hours * 60 +
        record.facility_total_hours.minutes;
    }
    if (record.driving_total_hours) {
      totalDrivingMinutes +=
        record.driving_total_hours.hours * 60 +
        record.driving_total_hours.minutes;
    }
  });

  const facilityHours = Math.floor(totalFacilityMinutes / 60);
  const facilityMinutes = totalFacilityMinutes % 60;
  const drivingHours = Math.floor(totalDrivingMinutes / 60);
  const drivingMinutes = totalDrivingMinutes % 60;

  return {
    facility: { hours: facilityHours, minutes: facilityMinutes },
    driving: { hours: drivingHours, minutes: drivingMinutes },
  };
};


  // Group the report data by employee_id
  const groupByEmployee = (reportData) => {
    return reportData.reduce((acc, record) => {
      // Create an entry for each employee if it doesn't exist
      if (!acc[record.employee_id]) {
        acc[record.employee_id] = {
          employee_id: record.employee_id,
          first_name: record.first_name,
          last_name: record.last_name,
          periods: [], // To hold the period summaries
        };
      }
      // Push the period data into the periods array
      acc[record.employee_id].periods.push(record);
      return acc;
    }, {});
  };

  // Function to handle period change and fetch data if needed
  const handlePeriodChange = (newPeriod) => {
    console.log(`Changing period to: ${newPeriod}`);
    setLoading(true);
    setPeriod(newPeriod);
    if (cachedData[newPeriod]) {
      console.log(`Using cached data for ${newPeriod}`, cachedData[newPeriod]);
      // Use cached data if available
      setReportData(cachedData[newPeriod]);
      setLoading(false);
    } else {
      console.log(`No cached data for period: ${newPeriod}`);
      // Simulate fetching data
      setTimeout(() => {
        setReportData([]); // Clear the data or set a default
        setLoading(false); // Stop loading after timeout
      }, 500); // Simulate a quick load
    }
  };

  // Helper function to format period based on weekly, monthly, or yearly
  const formatPeriodRange = useCallback((summaryPeriod, period) => {
    const startOfPeriod = new Date(summaryPeriod);

    if (period === "weekly") {
      const endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setDate(startOfPeriod.getDate() + 6);
      return `${formatDate(startOfPeriod)} - ${formatDate(endOfPeriod)}`;
    }

    if (period === "monthly") {
      return `${startOfPeriod.toLocaleString("default", {
        month: "long",
      })} ${startOfPeriod.getFullYear()}`;
    }

    if (period === "yearly") {
      return `${startOfPeriod.getUTCFullYear()}`;
    }

    return formatDate(startOfPeriod); // Fallback if no valid period is provided
  }, []);

  // Cache the initial data when the component mounts
  useEffect(() => {
    if (initialReportData) {
      console.log("Initial Report Data before formatting:", initialReportData);
      setLoading(true);
      const formattedData = initialReportData.map((data) => ({
        ...data,
        formatted_period: formatPeriodRange(data.summary_period, "weekly"), // Default to weekly
      }));
      console.log(
        "Formatted period (weekly):",
        formatPeriodRange("2024-11-25T00:00:00.000Z", "weekly")
      );
      setCachedData((prevCache) => ({
        ...prevCache,
        weekly: formattedData,
        monthly: formattedData.map((d) => ({
          ...d,
          formatted_period: formatPeriodRange(d.summary_period, "monthly"),
        })),
        yearly: formattedData.map((d) => ({
          ...d,
          formatted_period: formatPeriodRange(d.summary_period, "yearly"),
        })),
      }));
      setLoading(false);
    }
  }, [initialReportData, formatPeriodRange]);

  const handlePrint = () => {
    window.print();
  };

  // If loading, display a loading spinner/message
  if (loading) {
    return (
      <div className="text-center mt-4">
        <div className="spinner-border custom-spinner" role="status">
          <span className="visually-hidden">Preparing report...</span>
        </div>
      </div>
    );
  }

  // If no report data is available, display a message with a Back button
  if (!reportType || reportData.length === 0) {
    console.log("No report data or type provided");
    return (
      <div className="text-center">
        <p>No report data available</p>
        <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  const handleSaveCSV = () => {
    let headers = [
      "Employee ID",
      "First Name",
      "Last Name",
      "Facility Hours Worked",
      "Driving Hours Worked",
    ];

    // Ensure correct data mapping and default handling
    let dataRows = reportData.map((record) => {
      const facilityHours = record.facility_total_hours
        ? `${record.facility_total_hours.hours} hours ${record.facility_total_hours.minutes} minutes`
        : "0 hours 0 minutes";

      const drivingHours = record.driving_total_hours
        ? `${record.driving_total_hours.hours} hours ${record.driving_total_hours.minutes} minutes`
        : "0 hours 0 minutes";

      return [
        record.employee_id,
        record.first_name,
        record.last_name,
        facilityHours,
        drivingHours,
      ]
        .map((field) => `"${field}"`)
        .join(","); // Wrap each field in quotes
    });

    let rows = [
      ["Total Hours Report"],
      [], // Empty row for spacing
      headers.map((header) => `"${header}"`).join(","), // Quote headers
      ...dataRows,
    ];

    const formattedStartDate = formatDate(startDate, "YYYY-MM-DD");
    const formattedEndDate = formatDate(endDate, "YYYY-MM-DD");
    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Paychex_Timecard_Report_${formattedStartDate}_to_${formattedEndDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDetailedTimecards = () => {
    const totals = calculateTotalsForDetailedTimecards();
  
    return (
      <div className={`${styles.pageContainer} mt-4`}>
        <h2 className="text-center mb-4">Detailed Timecards Report</h2>
        <p className="text-center mb-3">
          {`Report for: ${formatDate(startDate)} - ${formatDate(endDate)}`}
          <br />
          <strong>Employee ID:</strong> {employeeId || "N/A"}
          <br />
          <strong>Employee Name:</strong> {firstName || "N/A"} {lastName || "N/A"}
        </p>
        <div className="text-center mb-4 print-hide">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>
            Print Report
          </button>
          {reportType === "totalHours" && (
            <button className="btn btn-secondary mx-2" onClick={handleSaveCSV}>
              Save as CSV
            </button>
          )}
          <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
        <table className={`table table-striped table-bordered text-center ${styles.table}`}>
          <thead>
            <tr>
              <th>Work Date</th>
              <th colSpan="5">Facility Activity</th>
              <th colSpan="5">Driving Activity</th>
            </tr>
            <tr>
              <th></th>
              <th>Start Time</th>
              <th>Lunch Start</th>
              <th>Lunch End</th>
              <th>End Time</th>
              <th>Total Hours</th>
              <th>Start Time</th>
              <th>Lunch Start</th>
              <th>Lunch End</th>
              <th>End Time</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((record) => (
              <tr key={record.timecard_id}>
                <td>{formatDate(record.work_date)}</td>
                {/* Facility Activity Columns */}
                <td>
                  {record.facility_start_time
                    ? formatTime(record.facility_start_time)
                    : "N/A"}
                </td>
                <td>
                  {record.facility_lunch_start
                    ? formatTime(record.facility_lunch_start)
                    : "N/A"}
                </td>
                <td>
                  {record.facility_lunch_end
                    ? formatTime(record.facility_lunch_end)
                    : "N/A"}
                </td>
                <td>
                  {record.facility_end_time
                    ? formatTime(record.facility_end_time)
                    : "N/A"}
                </td>
                <td>
                  {record.facility_total_hours
                    ? `${record.facility_total_hours.hours} hours ${record.facility_total_hours.minutes} minutes`
                    : "0 Hours 0 Minutes"}
                </td>
                {/* Driving Activity Columns */}
                <td>
                  {record.driving_start_time
                    ? formatTime(record.driving_start_time)
                    : "N/A"}
                </td>
                <td>
                  {record.driving_lunch_start
                    ? formatTime(record.driving_lunch_start)
                    : "N/A"}
                </td>
                <td>
                  {record.driving_lunch_end
                    ? formatTime(record.driving_lunch_end)
                    : "N/A"}
                </td>
                <td>
                  {record.driving_end_time
                    ? formatTime(record.driving_end_time)
                    : "N/A"}
                </td>
                <td>
                  {record.driving_total_hours
                    ? `${record.driving_total_hours.hours} hours ${record.driving_total_hours.minutes} minutes`
                    : "0 Hours 0 Minutes"}
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr>
              <td colSpan="5" style={{ textAlign: "right" }}>
                <strong>Total</strong>
              </td>
              <td>
                <strong>
                  {totals.facility.hours} hours <br /> {totals.facility.minutes} minutes
                </strong>
              </td>
              <td colSpan="4" style={{ textAlign: "right" }}>
                <strong>Total</strong>
              </td>
              <td>
                <strong>
                  {totals.driving.hours} hours <br /> {totals.driving.minutes} minutes
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  

  const renderTotalHours = () => {
    let facilityTotalHours = 0;
    let facilityTotalMinutes = 0;
    let drivingTotalHours = 0;
    let drivingTotalMinutes = 0;

    // Calculate total hours and minutes for facility and driving
    reportData.forEach((record) => {
      if (record.facility_total_hours) {
        const { hours, minutes } = record.facility_total_hours;
        facilityTotalHours += hours;
        facilityTotalMinutes += minutes;
      }
      if (record.driving_total_hours) {
        const { hours, minutes } = record.driving_total_hours;
        drivingTotalHours += hours;
        drivingTotalMinutes += minutes;
      }
    });

    // Adjust facility minutes into hours
    facilityTotalHours += Math.floor(facilityTotalMinutes / 60);
    facilityTotalMinutes = facilityTotalMinutes % 60;

    // Adjust driving minutes into hours
    drivingTotalHours += Math.floor(drivingTotalMinutes / 60);
    drivingTotalMinutes = drivingTotalMinutes % 60;

    return (
      <div className={`${styles.pageContainer} mt-4`}>
        <h2 className="text-center mb-4">Total Hours Report</h2>
        <p className="text-center mb-3">
          {`Report for: ${formatDate(startDate)} - ${formatDate(endDate)}`}
        </p>
        <div className="text-center mb-4">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>
            Print Report
          </button>
          <button className="btn btn-secondary mx-2" onClick={handleSaveCSV}>
            Save as CSV
          </button>
          <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
        <table className="table table-striped table-bordered text-center">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Facility Total Hours</th>
              <th>Driving Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((record) => (
              <tr key={record.employee_id}>
                <td>{record.employee_id}</td>
                <td>{record.first_name}</td>
                <td>{record.last_name}</td>
                <td>
                  {record.facility_total_hours &&
                  typeof record.facility_total_hours === "object"
                    ? `${record.facility_total_hours.hours || 0} hours ${
                        record.facility_total_hours.minutes || 0
                      } minutes`
                    : "0 Hours 0 Minutes"}
                </td>
                <td>
                  {record.driving_total_hours &&
                  typeof record.driving_total_hours === "object"
                    ? `${record.driving_total_hours.hours || 0} hours ${
                        record.driving_total_hours.minutes || 0
                      } minutes`
                    : "0 Hours 0 Minutes"}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" style={{ textAlign: "right" }}>
                <strong>Total</strong>
              </td>
              <td>
                <strong>
                  {facilityTotalHours} hours {facilityTotalMinutes} minutes
                </strong>
              </td>
              <td>
                <strong>
                  {drivingTotalHours} hours {drivingTotalMinutes} minutes
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderMonthlySummary = () => {
    return (
      <div className={`${styles.pageContainer} mt-4`}>
        <h2 className="text-center mb-4">Monthly Summary Report</h2>
        <div className="text-center mb-4">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>
            Print Report
          </button>
          <button className="btn btn-secondary mx-2" onClick={handleSaveCSV}>
            Save as CSV
          </button>
          <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
        <table className="table table-striped table-bordered text-center">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Month</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((record) => (
              <tr key={record.employee_id}>
                <td>{record.employee_id}</td>
                <td>{record.month}</td>
                <td>{record.total_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEmployeeSummary = () => {
    console.log("Rendering Employee Summary Report", reportData);
    const groupedData = groupByEmployee(reportData);

    return (
      <div className={`${styles.pageContainer} mt-4`}>
        <h2 className="text-center mb-4">Employee Summary Report</h2>

        {/* Place the period toggle buttons at the top */}
        <div className="text-center mb-4">
          <button
            className={`btn btn-sm mx-2 ${
              period === "weekly" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => handlePeriodChange("weekly")}
          >
            Weekly
          </button>
          <button
            className={`btn btn-sm mx-2 ${
              period === "monthly" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => handlePeriodChange("monthly")}
          >
            Monthly
          </button>
          <button
            className={`btn btn-sm mx-2 ${
              period === "yearly" ? "btn-primary" : "btn-secondary"
            }`}
            onClick={() => handlePeriodChange("yearly")}
          >
            Yearly
          </button>
        </div>

        <div className="text-center mb-4">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>
            Print Report
          </button>
          <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        {/* Iterate through each employee */}
        {Object.values(groupedData).map((employee) => (
          <div key={employee.employee_id}>
            <h3>
              {employee.first_name} {employee.last_name}
            </h3>

            <table className="table table-striped table-bordered text-center">
              <thead>
                <tr>
                  <th>
                    {period === "weekly"
                      ? "Period (Date Range)"
                      : period === "monthly"
                      ? "Month"
                      : "Year"}
                  </th>
                  <th>Facility Total Hours</th>
                  <th>Driving Total Hours</th>
                  <th>Days Worked</th>
                  <th>Days Absent</th>
                </tr>
              </thead>
              <tbody>
                {employee.periods.map((record, index) => (
                  <tr key={`${record.employee_id}-${index}`}>
                    <td>{formatPeriodRange(record.summary_period, period)}</td>
                    <td>
                      {record.facility_total_hours &&
                      typeof record.facility_total_hours === "object"
                        ? `${record.facility_total_hours.hours || 0} hours ${
                            record.facility_total_hours.minutes || 0
                          } minutes`
                        : "0 hours 0 minutes"}
                    </td>
                    <td>
                      {record.driving_total_hours &&
                      typeof record.driving_total_hours === "object"
                        ? `${record.driving_total_hours.hours || 0} hours ${
                            record.driving_total_hours.minutes || 0
                          } minutes`
                        : "0 hours 0 minutes"}
                    </td>
                    <td>{record.days_worked}</td>
                    <td>{record.absentee_days}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`${styles.pageContainer} mt-4`}>
      {reportType === "detailedTimecards" && renderDetailedTimecards()}
      {reportType === "totalHours" && renderTotalHours()}
      {reportType === "monthlySummary" && renderMonthlySummary()}
      {reportType === "employeeSummary" && renderEmployeeSummary()}
    </div>
  );
};

export default ReportPage;
