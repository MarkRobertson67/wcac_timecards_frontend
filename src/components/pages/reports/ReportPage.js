// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.


import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatDate, formatTime } from '../utils/TimeAndDateUtils';
import styles from "./TimeCardReports.module.css";

const API = process.env.REACT_APP_API_URL;

const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportType, startDate, endDate, employeeId, firstName, lastName, reportData: initialReportData } = location.state || {}; 
  console.log("Initial Report Data:", initialReportData);


  // State for toggling periods
  const [period, setPeriod] = useState('weekly');  // 'weekly', 'monthly', or 'yearly'
  const [reportData, setReportData] = useState(initialReportData || []); // Only use the data passed through location.state
  const [loading, setLoading] = useState(false); // Loading state
  const [cachedData, setCachedData] = useState({}); // Cache fetched data for each period


    // Group the report data by employee_id
    const groupByEmployee = (reportData) => {
      return reportData.reduce((acc, record) => {
        // Create an entry for each employee if it doesn't exist
        if (!acc[record.employee_id]) {
          acc[record.employee_id] = {
            employee_id: record.employee_id,
            first_name: record.first_name,
            last_name: record.last_name,
            periods: [] // To hold the period summaries
          };
        }
        // Push the period data into the periods array
        acc[record.employee_id].periods.push(record);
        return acc;
      }, {});
    };


  // Function to handle period change and fetch data if needed
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (cachedData[newPeriod]) {
      // Use cached data if available
      setReportData(cachedData[newPeriod]);
    } else {
      // Fetch data if not already cached
      fetchReportData(newPeriod);
    }
  };

    // Fetch data based on the period and report type
  const fetchReportData = useCallback(async (selectedPeriod) => {
    setLoading(true);
    let url = '';
    
    if (reportType === 'totalHours') {
      if (employeeId === 'ALL') {
        url = `${API}/reports/all/range/${startDate}/${endDate}`; // For all employees
      } else {
        url = `${API}/reports/${employeeId}?startDate=${startDate}&endDate=${endDate}`;
      }
    } else if (reportType === 'detailedTimecards') {
      url = `${API}/reports/detailed/${employeeId}?startDate=${startDate}&endDate=${endDate}`;
    } else if (reportType === 'employeeSummary') {
      if (employeeId === 'ALL') {
        url = `${API}/reports/all/employee-summary?startDate=${startDate}&endDate=${endDate}&period=${selectedPeriod}`;
      } else {
        url = `${API}/reports/employee-summary/${employeeId}?startDate=${startDate}&endDate=${endDate}&period=${selectedPeriod}`;
      }
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      setReportData(data.data || data); // 'data' field or is raw data
      setCachedData(prev => ({ ...prev, [selectedPeriod]: data.data || data })); // Cache data for the selected period
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [reportType, employeeId, startDate, endDate]);

  // Fetch the initial data on component mount
  useEffect(() => {
    fetchReportData(period); // Fetch data for the initial period (weekly by default)
  }, [fetchReportData, period]);



  const handlePrint = () => {
    window.print();
  };



  // If loading, display a loading spinner/message
  if (loading) {
    return <div className="text-center">Loading report data...</div>;
  }



  // If no report data is available, display a message
  if (!reportType || reportData.length === 0) {
    console.log("No report data or type provided");
    return <div className="text-center">No report data available</div>;
  }



  // Helper function to format period based on weekly, monthly, or yearly
  const formatPeriodRange = (summaryPeriod, period) => {
    const startOfPeriod = new Date(summaryPeriod);

    const startDateObj = new Date(startDate);
const year = startDateObj.getFullYear();
console.log("The year is:", year);

    if (period === 'weekly') {
      const endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setDate(startOfPeriod.getDate() + 6);
      return `${formatDate(startOfPeriod)} - ${formatDate(endOfPeriod)}`;
    }

    if (period === 'monthly') {
      return `${startOfPeriod.toLocaleString('default', { month: 'long' })} ${startOfPeriod.getFullYear()}`;
    }

    if (period === 'yearly') {
      return `${startOfPeriod.getUTCFullYear()}`;
    }

    return formatDate(startOfPeriod); // Fallback if no valid period is provided
  };



  const handleSaveCSV = () => {
    let headers = ['Employee ID', 'First Name', 'Last Name', 'Hours Worked'];
    let dataRows = reportData.map(record => {
      const totalHours = `${record.total_hours.hours} hours ${record.total_hours.minutes} minutes`;
      return [
        record.employee_id,
        record.first_name,
        record.last_name,
        totalHours,
      ].map(field => `"${field}"`).join(","); // Wrap each field in quotes
    });

    let rows = [
      ['Total Hours Report'],
      [], // Empty row for spacing
      headers.map(header => `"${header}"`).join(","), // Quote headers
      ...dataRows
    ];

    const formattedStartDate = formatDate(startDate, 'YYYY-MM-DD');
    const formattedEndDate = formatDate(endDate, 'YYYY-MM-DD');
    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Paychex_Timecard_Report_${formattedStartDate}_to_${formattedEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};



  const renderDetailedTimecards = () => {
    const employeeInfo = reportData.length > 0 ? reportData[0] : {};
    console.log(employeeInfo)

    return (
      <div className={`${styles.container} mt-4`}>
        <h2 className="text-center mb-4">Detailed Timecards Report</h2>
        <p className="text-center mb-3">
          {`Report for: ${formatDate(startDate)} - ${formatDate(endDate)}`}<br />
          <strong>Employee ID:</strong> {employeeId || 'N/A'}<br />
          <strong>Employee Name:</strong> {firstName || 'N/A'} {lastName || 'N/A'}
        </p>
        <div className="text-center mb-4 print-hide">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>Print Report</button>
          {reportType === 'totalHours' && (
            <button className="btn btn-secondary mx-2" onClick={handleSaveCSV}>Save as CSV</button>
          )}
          <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>Back</button>
        </div>
        <table className="table table-striped table-bordered text-center">
          <thead>
            <tr>
              <th>Work Date</th>
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
                <td>{formatTime(record.start_time)}</td>
                <td>{formatTime(record.lunch_start)}</td>
                <td>{formatTime(record.lunch_end)}</td>
                <td>{formatTime(record.end_time)}</td>
                <td>
                  {record.total_hours
                    ? `${record.total_hours.hours} hours ${record.total_hours.minutes} minutes`
                    : "0 Hours 0 Minutes"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTotalHours = () => {
    let totalHours = 0;
    let totalMinutes = 0;

    reportData.forEach(record => {
      if (record.total_hours) {
        const { hours, minutes } = record.total_hours;
        totalHours += hours;
        totalMinutes += minutes;
      }
    });

    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    return (
      <div className={`${styles.container} mt-4`}>
        <h2 className="text-center mb-4">Total Hours Report</h2>
        <p className="text-center mb-3">
          {`Report for: ${formatDate(startDate)} - ${formatDate(endDate)}`}
        </p>
        <div className="text-center mb-4">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>Print Report</button>
          <button className="btn btn-secondary mx-2" onClick={handleSaveCSV}>Save as CSV</button>
          <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>Back</button>
        </div>
        <table className="table table-striped table-bordered text-center">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((record) => (
              <tr key={record.employee_id}>
                <td>{record.employee_id}</td>
                <td>{record.first_name}</td>
                <td>{record.last_name}</td>
                <td>
                  {record.total_hours
                    ? `${record.total_hours.hours} hours ${record.total_hours.minutes}`
                    : "0 Hours 0 Minutes"}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" style={{ textAlign: 'right' }}><strong>Total</strong></td>
              <td><strong>{totalHours} hours {totalMinutes} minutes</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };


  const renderMonthlySummary = () => {
    return (
      <div className={`${styles.container} mt-4`}>
        <h2 className="text-center mb-4">Monthly Summary Report</h2>
        <div className="text-center mb-4">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>Print Report</button>
          <button className="btn btn-secondary mx-2" onClick={handleSaveCSV}>Save as CSV</button>
          <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>Back</button>
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
    const groupedData = groupByEmployee(reportData);
  
    return (
      <div className={`${styles.container} mt-4`}>
        <h2 className="text-center mb-4">Employee Summary Report</h2>
  
        {/* Place the period toggle buttons at the top */}
        <div className="text-center mb-4">
          <button className={`btn btn-sm mx-2 ${period === 'weekly' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handlePeriodChange('weekly')}>Weekly</button>
          <button className={`btn btn-sm mx-2 ${period === 'monthly' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handlePeriodChange('monthly')}>Monthly</button>
          <button className={`btn btn-sm mx-2 ${period === 'yearly' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handlePeriodChange('yearly')}>Yearly</button>
        </div>
  
        <div className="text-center mb-4">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>Print Report</button>
          <button className="btn btn-dark mx-2" onClick={() => navigate(-1)}>Back</button>
        </div>
  
        {/* Iterate through each employee */}
        {Object.values(groupedData).map(employee => (
          <div key={employee.employee_id}>
            <h3>{employee.first_name} {employee.last_name}</h3>
  
            <table className="table table-striped table-bordered text-center">
              <thead>
                <tr>
                  <th>{period === 'weekly' ? 'Period (Date Range)' : period === 'monthly' ? 'Month' : 'Year'}</th>
                  <th>Total Hours Worked</th>
                  <th>Days Worked</th>
                  <th>Days Absent</th>
                </tr>
              </thead>
              <tbody>
                {employee.periods.map((record, index) => (
                  <tr key={`${record.employee_id}-${index}`}>
                    <td>{formatPeriodRange(record.summary_period, period)}</td>
                    <td>
                      {record.total_hours && typeof record.total_hours === 'object' 
                        ? `${record.total_hours.hours || 0} hours ${record.total_hours.minutes || 0} minutes` 
                        : '0 hours 0 minutes'}
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
    <div className={`${styles.container} mt-4`}>
      {reportType === 'detailedTimecards' && renderDetailedTimecards()}
      {reportType === 'totalHours' && renderTotalHours()}
      {reportType === 'monthlySummary' && renderMonthlySummary()}
      {reportType === 'employeeSummary' && renderEmployeeSummary()}
    </div>
  );
};

export default ReportPage;
