// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { formatDate, formatTime } from '../utils/TimeAndDateUtils'; 
import styles from "./TimeCardReports.module.css"


const ReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportType, reportData } = location.state || {};

  if (!reportType || !reportData) {
    return <div className="text-center">No report data available</div>;
  }

  const handlePrint = () => {
    window.print();
  };


  const handleSaveCSV = () => {
    let rows;
    // Check the report type and format the rows accordingly
    if (reportType === 'totalHours' || reportType === 'employeeSummary' || reportType === 'monthlySummary') {
      rows = [
        ['Employee ID', 'First Name', 'Last Name', 'Total Hours'], // Adjust headers as per report type
        ...reportData.map(record => [
          record.employee_id || '',
          record.first_name || '',
          record.last_name || '',
          record.total_hours || ''
        ])
      ];
    } else if (reportType === 'detailedTimecards') {
      rows = [
        ['Work Date', 'Start Time', 'Lunch Start', 'Lunch End', 'End Time', 'Total Hours'], // Header for detailed timecards
        ...reportData.map(record => [
          formatDate(record.work_date) || '',
          formatTime(record.start_time) || '',
          formatTime(record.lunch_start) || '',
          formatTime(record.lunch_end) || '',
          formatTime(record.end_time) || '',
          record.total_time || ''
        ])
      ];
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  const renderDetailedTimecards = () => {
    return (
      <div className={`${styles.container} mt-4`}>
        <h2 className="text-center mb-4">Detailed Timecards Report</h2>
        <div className="text-center mb-4 print-hide">
        <div className="print-hide">
          <button className="btn btn-primary mx-2 print-hide" onClick={handlePrint}>Print Report</button>
          <button className="btn btn-secondary mx-2 print-hide" onClick={handleSaveCSV}>Save as CSV</button>
          <button className="btn btn-dark mx-2 print-hide" onClick={() => navigate(-1)}>Back</button>
          </div>
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
            {reportData.map((record) => {

              return (
                <tr key={record.timecard_id}>
                  <td>{formatDate(record.work_date)}</td>
                  <td>{formatTime(record.start_time)}</td>
                  <td>{formatTime(record.lunch_start)}</td>
                  <td>{formatTime(record.lunch_end)}</td>
                  <td>{formatTime(record.end_time)}</td>
                  <td>{record.total_hours}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTotalHours = () => {
    return (
      <div className={`${styles.container} mt-4`}>
        <h2 className="text-center mb-4">Total Hours Report</h2>
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
                <td>{record.total_hours}</td>
              </tr>
            ))}
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
    // Example rendering for Employee Summary Report
    return (
      <div className={`${styles.container} mt-4`}>
        <h2 className="text-center mb-4">Detailed Timecards Report</h2>
        <div className="text-center mb-4">
          <button className="btn btn-primary mx-2" onClick={handlePrint}>Print Report</button>
          <button className="btn btn-secondary mx-2" onClick={handleSaveCSV}>Save as CSV</button>
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
              <tr key={record.id}>
                <td>{formatDate(record.work_date)}</td>
                <td>{formatTime(record.start_time)}</td>
                <td>{formatTime(record.lunch_start)}</td>
                <td>{formatTime(record.lunch_end)}</td>
                <td>{formatTime(record.end_time)}</td>
                <td>{record.total_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  

  return (
    <div className={`${styles.container} mt-4`}>
      {reportType === 'detailedTimecards' && renderDetailedTimecards()}
      {reportType === 'totalHours' && renderTotalHours()}
      {reportType === 'monthlySummary' && renderMonthlySummary()}
      {reportType === 'employeeSummary' && renderEmployeeSummary()}
      {/* Add other report types as needed */}
    </div>
  );
};

export default ReportPage;