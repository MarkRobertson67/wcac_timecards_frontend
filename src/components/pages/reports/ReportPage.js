// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDate, formatTime } from "../utils/TimeAndDateUtils";
import styles from "./ReportPage.module.css";

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
  const [period, setPeriod] = useState("weekly");
  const [reportData, setReportData] = useState(initialReportData || []);
  const [loading, setLoading] = useState(false);
  const [cachedData, setCachedData] = useState({}); // Cache data for periods

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

  const formatPeriodRange = useCallback((summaryPeriod, period) => {
    // Skip parsing if it's already a formatted label (e.g., "March 2025", "2024")
    if (typeof summaryPeriod === "string" && !summaryPeriod.includes("T")) {
      return summaryPeriod; // use as-is, it's already formatted
    }

    const date = new Date(summaryPeriod);
    if (isNaN(date)) {
      console.warn("⚠️ Not a parseable ISO date string:", summaryPeriod);
      return "Invalid Date";
    }

    if (period === "weekly") {
      const endOfWeek = new Date(date);
      endOfWeek.setDate(date.getDate() + 6);
      return `${formatDate(date)} ${formatDate(endOfWeek)}`;
    }

    if (period === "monthly") {
      const month = date.toLocaleString("default", { month: "long" });
      const year = date.getFullYear();
      return `${month} ${year}`;
    }

    if (period === "yearly") {
      return `${date.getFullYear()}`;
    }

    return formatDate(date); // fallback
  }, []);

  const aggregateDataByPeriod = useCallback(
    (data, period) => {
      const aggregation = {};
      data.forEach((record) => {
        // Use the preserved original date for grouping (if available) or fallback to summary_period
        const originalDate =
          record.original_summary_period || record.summary_period;
        const periodLabel = formatPeriodRange(originalDate, period);
        if (!aggregation[periodLabel]) {
          aggregation[periodLabel] = {
            summary_period: periodLabel,
            facility_total_hours: { hours: 0, minutes: 0 },
            driving_total_hours: { hours: 0, minutes: 0 },
            days_worked: 0,
            absentee_days: 0,
            employee_id: record.employee_id,
            first_name: record.first_name,
            last_name: record.last_name,
          };
        }
        aggregation[periodLabel].facility_total_hours.hours +=
          record.facility_total_hours.hours;
        aggregation[periodLabel].facility_total_hours.minutes +=
          record.facility_total_hours.minutes;
        aggregation[periodLabel].driving_total_hours.hours +=
          record.driving_total_hours.hours;
        aggregation[periodLabel].driving_total_hours.minutes +=
          record.driving_total_hours.minutes;
        aggregation[periodLabel].days_worked += Number(record.days_worked) || 0;
        aggregation[periodLabel].absentee_days +=
          Number(record.absentee_days) || 0;
      });

      // Normalize minutes into hours for each period
      Object.values(aggregation).forEach((item) => {
        const extraFacilityHours = Math.floor(
          item.facility_total_hours.minutes / 60
        );
        item.facility_total_hours.hours += extraFacilityHours;
        item.facility_total_hours.minutes %= 60;

        const extraDrivingHours = Math.floor(
          item.driving_total_hours.minutes / 60
        );
        item.driving_total_hours.hours += extraDrivingHours;
        item.driving_total_hours.minutes %= 60;
      });

      return Object.values(aggregation);
    },
    [formatPeriodRange]
  );

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
        setReportData([]);
        setLoading(false);
      }, 500);
    }
  };

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
        .join(",");
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
    const employeeInfo = reportData.length > 0 ? reportData[0] : {};
    console.log(employeeInfo);

    return (
      <div id="reportPrint" className={styles.pageContainer}>
        <div id="reportTop" />

        {/* — TABLE — */}
        <div className={`${styles.reportTableContainer} reportTableContainer`}>
          <div className="print-only titleContainer">
            <h2 className="text-center mb-3">Detailed Timecards Report</h2>
            <p className="text-center mb-3">
              {`Report for: ${formatDate(startDate)} - ${formatDate(endDate)}`}
              <br />
              <strong>Employee ID:</strong> {employeeId || "N/A"}
              <br />
              <strong>Employee Name:</strong> {firstName || "N/A"}{" "}
              {lastName || "N/A"}
            </p>
          </div>
          {/* — SCREEN-ONLY BUTTONS — */}
          <div
            className="print-hide mb-4"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
              paddingBottom: "20px",
              paddingRight: "20px",
            }}
          >
            <button
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ flex: "1 0 120px", maxWidth: "150px" }}
            >
              Print Report
            </button>
            <button
              className="btn btn-dark"
              onClick={() => navigate(-1)}
              style={{ flex: "1 0 120px", maxWidth: "150px" }}
            >
              Back
            </button>
          </div>
          <table
            className={`table table-striped table-bordered text-center ${styles.table}`}
          >
            <thead>
              <tr>
                <th>Work Date</th>
                <th colSpan="5">Facility Activity</th>
                <th colSpan="5">Driving Activity</th>
              </tr>
              <tr>
                <th style={{ width: "160px" }}></th>
                <th>Start Time</th>
                <th>Lunch Start</th>
                <th>Lunch End</th>
                <th>End Time</th>
                <th style={{ width: "120px" }}>Total Hours</th>
                <th>Start Time</th>
                <th>Lunch Start</th>
                <th>Lunch End</th>
                <th>End Time</th>
                <th style={{ width: "120px" }}>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((record) => (
                <tr key={record.timecard_id}>
                  <td>{formatDate(record.work_date)}</td>
                  {/* Facility Activity */}
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
                      ? `${record.facility_total_hours.hours} h ${record.facility_total_hours.minutes} min`
                      : "0 hours 0 minutes"}
                  </td>
                  {/* Driving Activity */}
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
                      ? `${record.driving_total_hours.hours} h ${record.driving_total_hours.minutes} min`
                      : "0 hours 0 hinutes"}
                  </td>
                </tr>
              ))}
              {/* Overall Totals */}
              <tr>
                <td colSpan="5" style={{ textAlign: "right" }}>
                  <strong>Total</strong>
                </td>
                <td className="time-cell">
                  <strong>
                    <div>{totals.facility.hours} hours</div>
                    <div>{totals.facility.minutes} minutes</div>
                  </strong>
                </td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="time-cell">
                  <strong>
                    <div>{totals.driving.hours} hours</div>
                    <div>{totals.driving.minutes} minutes</div>
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* — BACK TO TOP — */}
          <button
            className={`btn btn-sm btn-secondary mt-3 ${styles.backToTopButton}`}
            onClick={() => {
              const el = document.getElementById("reportTop");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Back to Top
          </button>
        </div>
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
      <div id="reportPrint" className={`${styles.pageContainer} mt-4`}>
        <div id="reportTop" />
        <div className={styles.reportTableContainer}>
          <div>
            <div id="titleBlock" className={styles.titleContainer}>
              <h2 className="text-center">Total Hours Report</h2>
              <p className="text-center">
                {`Report for: ${formatDate(startDate)} - ${formatDate(
                  endDate
                )}`}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "2rem",
              }}
              className="print-hide"
            >
              <button
                className="btn btn-sm btn-primary"
                onClick={handlePrint}
                style={{ flex: "1 0 100px", maxWidth: "140px" }}
              >
                Print Report
              </button>

              {reportType === "totalHours" && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleSaveCSV}
                  style={{ flex: "1 0 100px", maxWidth: "140px" }}
                >
                  Save as CSV
                </button>
              )}

              <button
                className="btn btn-sm btn-dark"
                onClick={() => navigate(-1)}
                style={{ flex: "1 0 100px", maxWidth: "140px" }}
              >
                Back
              </button>
            </div>
          </div>
          <table className="table table-striped table-bordered text-center">
            <thead>
              <tr>
                <th>
                  <span className="d-none d-md-inline">Employee ID</span>
                  <span className="d-inline d-md-none">ID</span>
                </th>

                <th>Name</th>
                <th>Facility Total Hours</th>
                <th>Driving Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((record) => {
                const fac = record.facility_total_hours ?? {
                  hours: 0,
                  minutes: 0,
                };
                const drv = record.driving_total_hours ?? {
                  hours: 0,
                  minutes: 0,
                };
                return (
                  <tr key={record.employee_id}>
                    <td>{record.employee_id}</td>
                    <td>{`${record.first_name} ${record.last_name}`}</td>

                    <td className="time-cell">
                      {fac.hours} Hours <br className="mobile-break" />
                      {fac.minutes} Minutes
                    </td>

                    <td className="time-cell">
                      {drv.hours} Hours <br className="mobile-break" />
                      {drv.minutes} Minutes
                    </td>
                  </tr>
                );
              })}

              <tr>
                <td colSpan="2" style={{ textAlign: "right" }}>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>
                    {facilityTotalHours} Hours <br className="mobile-break" />
                    {facilityTotalMinutes} Minutes
                  </strong>
                </td>
                <td>
                  <strong>
                    {drivingTotalHours} Hours <br className="mobile-break" />
                    {drivingTotalMinutes} Minutes
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
          <button
            className={`btn btn-sm btn-secondary mt-3 ${styles.backToTopButton}`}
            onClick={() => {
              const el = document.getElementById("reportTop");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              else window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Back to Top
          </button>
        </div>
      </div>
    );
  };

  const renderEmployeeSummary = () => {
    // Determine title prefix based on period
    let titlePrefix = "";
    if (period === "weekly") {
      titlePrefix = "Weekly";
    } else if (period === "monthly") {
      titlePrefix = "Monthly";
    } else if (period === "yearly") {
      titlePrefix = "Yearly";
    }

    // ALL employees branch
    if (employeeId === "ALL") {
      const groupedData = groupByEmployee(reportData);

      return (
        <div id="reportPrint" className={`${styles.pageContainer} mt-4`}>
          <div id="reportTop" />

          {/* One scrollable wrapper for title + all employee tables */}
          <div
            className={`${styles.reportTableContainer} reportTableContainer`}
          >
            {/* — PRINT ONLY: Title + subtitle */}
            <div className="print-only titleContainer">
              <h2 className="text-center mb-3">
                {titlePrefix} Employee Summary Report For ALL
              </h2>
              <p className="text-center mb-3">
                {`Report for: ${formatDate(startDate)} – ${formatDate(
                  endDate
                )}`}
              </p>
            </div>

            {/* Buttons Block */}
            {/* — SCREEN ONLY: Period toggles + Print/Back */}
            <div className="print-hide mb-4">
              {/* Period Toggle Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                }}
              >
                <button
                  className={`btn btn-sm ${
                    period === "weekly" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => handlePeriodChange("weekly")}
                  style={{ flex: "1 0 100px", maxWidth: "120px" }}
                >
                  Weekly
                </button>
                <button
                  className={`btn btn-sm ${
                    period === "monthly" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => handlePeriodChange("monthly")}
                  style={{ flex: "1 0 100px", maxWidth: "120px" }}
                >
                  Monthly
                </button>
                <button
                  className={`btn btn-sm ${
                    period === "yearly" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => handlePeriodChange("yearly")}
                  style={{ flex: "1 0 100px", maxWidth: "120px" }}
                >
                  Yearly
                </button>
              </div>

              {/* Print / Back Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
                className="print-hide"
              >
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handlePrint}
                  style={{ flex: "1 0 100px", maxWidth: "120px" }}
                >
                  Print Report
                </button>
                <button
                  className="btn btn-sm btn-dark"
                  onClick={() => navigate(-1)}
                  style={{ flex: "1 0 100px", maxWidth: "120px" }}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Render a table for each employee */}
            {Object.values(groupedData).map((employee) => {
              // For monthly/yearly, aggregate this employee's periods
              const records =
                period === "weekly"
                  ? employee.periods
                  : aggregateDataByPeriod(employee.periods, period);

              // Compute overall totals for this employee (from the aggregated records)
              const employeeTotals = records.reduce(
                (acc, record) => {
                  const facH = record.facility_total_hours
                    ? parseInt(record.facility_total_hours.hours, 10) || 0
                    : 0;
                  const facM = record.facility_total_hours
                    ? parseInt(record.facility_total_hours.minutes, 10) || 0
                    : 0;
                  const drvH = record.driving_total_hours
                    ? parseInt(record.driving_total_hours.hours, 10) || 0
                    : 0;
                  const drvM = record.driving_total_hours
                    ? parseInt(record.driving_total_hours.minutes, 10) || 0
                    : 0;
                  acc.facility.hours += facH;
                  acc.facility.minutes += facM;
                  acc.driving.hours += drvH;
                  acc.driving.minutes += drvM;
                  acc.daysWorked += Number(record.days_worked) || 0;
                  acc.absenteeDays += Number(record.absentee_days) || 0;
                  return acc;
                },
                {
                  facility: { hours: 0, minutes: 0 },
                  driving: { hours: 0, minutes: 0 },
                  daysWorked: 0,
                  absenteeDays: 0,
                }
              );
              // Normalize minutes to hours
              employeeTotals.facility.hours += Math.floor(
                employeeTotals.facility.minutes / 60
              );
              employeeTotals.facility.minutes %= 60;
              employeeTotals.driving.hours += Math.floor(
                employeeTotals.driving.minutes / 60
              );
              employeeTotals.driving.minutes %= 60;

              return (
                <div
                  key={employee.employee_id}
                  className={`page-break-inside: avoid;  
           page-break-after: automb-4`}
                >
                  <h3 style={{ textAlign: "left" }}>
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <table className="table table-striped table-bordered">
                    <thead>
                      <tr>
                        <th style={{ textAlign: "left" }}>
                          {period === "weekly"
                            ? "Period (Date Range)"
                            : period === "monthly"
                            ? "Month"
                            : "Year"}
                        </th>
                        <th style={{ textAlign: "left" }}>
                          Facility Total Hours
                        </th>
                        <th style={{ textAlign: "left" }}>
                          Driving Total Hours
                        </th>
                        <th style={{ textAlign: "left" }}>Days Worked</th>
                        <th style={{ textAlign: "left" }}>Days Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, index) => (
                        <tr key={`${employee.employee_id}-${index}`}>
                          <td>
                            {period === "weekly"
                              ? formatPeriodRange(
                                  record.summary_period,
                                  "weekly"
                                )
                              : formatPeriodRange(
                                  record.summary_period,
                                  period
                                )}
                          </td>
                          <td>
                            {record.facility_total_hours ? (
                              <>
                                {record.facility_total_hours.hours} h{" "}
                                <br className="mobile-break" />
                                {record.facility_total_hours.minutes} min
                              </>
                            ) : (
                              <>0 hours 0 minutes</>
                            )}
                          </td>
                          <td>
                            {record.driving_total_hours ? (
                              <>
                                {record.driving_total_hours.hours} h{" "}
                                <br className="mobile-break" />
                                {record.driving_total_hours.minutes} min
                              </>
                            ) : (
                              <>0 hours 0 minutes</>
                            )}
                          </td>

                          <td>{record.days_worked}</td>
                          <td>{record.absentee_days}</td>
                        </tr>
                      ))}
                      {/* Overall Totals Row for this employee */}
                      <tr>
                        <td style={{ textAlign: "right" }}>
                          <strong>Overall Totals</strong>
                        </td>
                        <td>
                          <strong>
                            {employeeTotals.facility.hours} h{"  "}
                            <br className="mobile-break" />
                            {employeeTotals.facility.minutes} min
                          </strong>
                        </td>
                        <td>
                          <strong>
                            {employeeTotals.driving.hours} h{"  "}
                            <br className="mobile-break" />
                            {employeeTotals.driving.minutes} min
                          </strong>
                        </td>
                        <td>
                          <strong>{employeeTotals.daysWorked}</strong>
                        </td>
                        <td>
                          <strong>{employeeTotals.absenteeDays}</strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <br />
                </div>
              );
            })}
            <button
              className={`btn btn-sm btn-secondary mt-3 print-hide ${styles.backToTopButton}`}
              onClick={() => {
                const el = document.getElementById("reportTop");
                if (el)
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                else window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Back to Top
            </button>
          </div>
        </div>
      );
    } else {
      // Single employee branch
      // If the period is monthly or yearly, aggregate the single employee’s data
      const records =
        period === "weekly"
          ? reportData
          : aggregateDataByPeriod(reportData, period);

      // Compute overall totals from `records` (the aggregated data)
      const overallTotalsForSingle = records.reduce(
        (acc, record) => {
          const facH = record.facility_total_hours
            ? parseInt(record.facility_total_hours.hours, 10) || 0
            : 0;
          const facM = record.facility_total_hours
            ? parseInt(record.facility_total_hours.minutes, 10) || 0
            : 0;
          const drvH = record.driving_total_hours
            ? parseInt(record.driving_total_hours.hours, 10) || 0
            : 0;
          const drvM = record.driving_total_hours
            ? parseInt(record.driving_total_hours.minutes, 10) || 0
            : 0;

          acc.facility.hours += facH;
          acc.facility.minutes += facM;
          acc.driving.hours += drvH;
          acc.driving.minutes += drvM;
          acc.daysWorked += Number(record.days_worked) || 0;
          acc.absenteeDays += Number(record.absentee_days) || 0;
          return acc;
        },
        {
          facility: { hours: 0, minutes: 0 },
          driving: { hours: 0, minutes: 0 },
          daysWorked: 0,
          absenteeDays: 0,
        }
      );

      // Normalize minutes
      overallTotalsForSingle.facility.hours += Math.floor(
        overallTotalsForSingle.facility.minutes / 60
      );
      overallTotalsForSingle.facility.minutes %= 60;
      overallTotalsForSingle.driving.hours += Math.floor(
        overallTotalsForSingle.driving.minutes / 60
      );
      overallTotalsForSingle.driving.minutes %= 60;

      return (
        <div id="reportPrint" className={styles.pageContainer}>
          <div id="reportTop" />

          <div
            className={`${styles.reportTableContainer} reportTableContainer`}
          >
            {/* PRINT ONLY: single‐employee title */}
            <div className="print-only titleContainer">
              <h2 className="text-center mb-4">
                {titlePrefix} Employee Summary Report For <br /> {firstName}{" "}
                {lastName}
              </h2>
              <p className="text-center mb-3">
                {`Report for: ${formatDate(startDate)} – ${formatDate(
                  endDate
                )}`}
              </p>
            </div>

            <div className="text-center print-hide mb-4">
              {/* Period Toggle Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginBottom: "1rem",
                }}
              >
                <button
                  className={`btn btn-sm ${
                    period === "weekly" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => handlePeriodChange("weekly")}
                  style={{
                    flex: "1 0 100px",
                    maxWidth: "120px",
                    padding: "6px 10px",
                    fontSize: "0.85rem",
                  }}
                >
                  Weekly
                </button>
                <button
                  className={`btn btn-sm ${
                    period === "monthly" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => handlePeriodChange("monthly")}
                  style={{
                    flex: "1 0 100px",
                    maxWidth: "120px",
                    padding: "6px 10px",
                    fontSize: "0.85rem",
                  }}
                >
                  Monthly
                </button>
                <button
                  className={`btn btn-sm ${
                    period === "yearly" ? "btn-primary" : "btn-secondary"
                  }`}
                  onClick={() => handlePeriodChange("yearly")}
                  style={{
                    flex: "1 0 100px",
                    maxWidth: "120px",
                    padding: "6px 10px",
                    fontSize: "0.85rem",
                  }}
                >
                  Yearly
                </button>
              </div>

              {/* Print / Back Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={handlePrint}
                  style={{
                    flex: "1 0 100px",
                    maxWidth: "120px",
                    padding: "6px 10px",
                    fontSize: "0.85rem",
                  }}
                >
                  Print Report
                </button>
                <button
                  className="btn btn-dark"
                  onClick={() => navigate(-1)}
                  style={{
                    flex: "1 0 100px",
                    maxWidth: "120px",
                    padding: "6px 10px",
                    fontSize: "0.85rem",
                  }}
                >
                  Back
                </button>
              </div>
            </div>

            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>
                    {period === "weekly"
                      ? "Period (Date Range)"
                      : period === "monthly"
                      ? "Month"
                      : "Year"}
                  </th>

                  <th style={{ textAlign: "left" }}>
                    Facility {"  "}
                    <br className="mobile-break" />
                    Total {"  "}
                    <br className="mobile-break" />
                    Hours
                  </th>
                  <th style={{ textAlign: "left" }}>
                    Driving {"  "}
                    <br className="mobile-break" />
                    Total {"  "}
                    <br className="mobile-break" />
                    Hours
                  </th>
                  <th style={{ textAlign: "left" }}>
                    Days {"  "}
                    <br className="mobile-break" />
                    Worked
                  </th>
                  <th style={{ textAlign: "left" }}>
                    Days {"  "}
                    <br className="mobile-break" />
                    Absent
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => {
                  // 1) Compute label once
                  const raw = record.summary_period;
                  let label =
                    record.formatted_period ||
                    formatPeriodRange(raw, period) ||
                    "Missing Period";
                  if (label === "Invalid Month" || label === "Invalid Date") {
                    console.warn("⚠️ Found invalid label:", { raw });
                  }

                  const parts = label.split(" - ");

                  return (
                    <tr key={`${employeeId}-${index}`}>
                      <td>
                        {parts.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </td>

                      <td>
                        {record.facility_total_hours ? (
                          <>
                            {record.facility_total_hours.hours} h
                            <br className="mobile-break" />
                            {record.facility_total_hours.minutes} min
                          </>
                        ) : (
                          <>
                            0 h
                            <br className="mobile-break" />0 min
                          </>
                        )}
                      </td>
                      <td>
                        {record.driving_total_hours ? (
                          <>
                            {record.driving_total_hours.hours} h
                            <br className="mobile-break" />
                            {record.driving_total_hours.minutes} min
                          </>
                        ) : (
                          <>
                            0 h
                            <br className="mobile-break" />0 min
                          </>
                        )}
                      </td>

                      <td>{record.days_worked}</td>
                      <td>{record.absentee_days}</td>
                    </tr>
                  );
                })}
                {/* Overall Totals */}
                <tr>
                  <td style={{ textAlign: "right" }}>
                    <strong>Overall Totals</strong>
                  </td>
                  <td>
                    <strong>
                      {overallTotalsForSingle.facility.hours} h{" "}
                      <br className="mobile-break" />
                      {overallTotalsForSingle.facility.minutes} min
                    </strong>
                  </td>
                  <td>
                    <strong>
                      {overallTotalsForSingle.driving.hours} h{" "}
                      <br className="mobile-break" />
                      {overallTotalsForSingle.driving.minutes} min
                    </strong>
                  </td>

                  <td>
                    <strong>{overallTotalsForSingle.daysWorked}</strong>
                  </td>
                  <td>
                    <strong>{overallTotalsForSingle.absenteeDays}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* SCREEN ONLY: final “Back to Top” */}
            <button
              className={`btn btn-sm btn-secondary mt-3 ${styles.backToTopButton}`}
              onClick={() => {
                const topEl = document.getElementById("reportTop");
                if (topEl) topEl.scrollIntoView({ behavior: "smooth" });
                else window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Back to Top
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`${styles.reportpageContainer} mt-4`}>
      {reportType === "detailedTimecards" && renderDetailedTimecards()}
      {reportType === "totalHours" && renderTotalHours()}
      {reportType === "employeeSummary" && renderEmployeeSummary()}
    </div>
  );
};

export default ReportPage;
