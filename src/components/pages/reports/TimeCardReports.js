// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL;

function TimeCardReports() {
  const navigate = useNavigate();

  // State variables for report parameters
  const [reportType, setReportType] = useState('totalHours');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [month, setMonth] = useState({ value: '1', label: 'January' });
  const [year, setYear] = useState('2024');
  const [period, setPeriod] = useState('weekly');
  const [employees, setEmployees] = useState([]);

  // Function to reset all form fields
  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setEmployeeId('');
    setSelectedEmployeeName('');
    setMonth({ value: '1', label: 'January' });
    setYear('2024');
    setPeriod('weekly');
  };

  // Function to handle exporting CSV data
  const handleExportCsv = (endpoint, filename) => {
    fetch(endpoint)
      .then(response => response.json())
      .then(data => {
        const csv = data.map(row =>
          `${row.employee_id},${row.first_name},${row.last_name},${row.total_hours}`
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  // Function to fetch employees from API
  const fetchEmployees = () => {
    fetch(`${API}/employees`)
      .then(response => response.json())
      .then(data => {
        setEmployees(data.data);
        console.log(data.data);
      })
      .catch(error => {
        console.error('Error fetching employees:', error);
      });
  };

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleGenerateReport = async () => {
    let url;
    let queryParams = {};
  
    // Log the selected employee name to debug
    console.log('Selected Employee Name:', selectedEmployeeName);
  
    // Find the employee ID based on the selected employee name
    const selectedEmployee = employees.find(emp => `${emp.first_name} ${emp.last_name}`.trim() === selectedEmployeeName.trim());
  
    // Log the found employee ID to debug
    console.log('Selected Employee:', selectedEmployee);
  
    const empId = selectedEmployee ? selectedEmployee.id : null; // Changed to 'id' based on your data
  
    // Log the selected employee ID
    console.log('Selected Employee ID:', empId);
  
    if (!empId) {
      console.error('Invalid employee selected or employee ID not found');
      return;
    }
  
    switch (reportType) {
      case 'totalHours':
        url = `${API}/reports/${empId}`;
        queryParams = { startDate, endDate };
        break;
      case 'detailedTimecards':
        url = `${API}/reports/detailed/${empId}`;
        queryParams = { startDate, endDate };
        break;
      case 'absenteeism':
        url = `${API}/reports/absenteeism`;
        queryParams = { startDate, endDate };
        break;
      case 'monthlySummary':
        url = `${API}/reports/monthly-summary`;
        queryParams = { month: month.value, year };
        break;
      case 'employeeSummary':
        url = `${API}/reports/employee-summary`;
        queryParams = { employeeId: empId, period };
        break;
      default:
        console.error('Invalid report type');
        return;
    }
  
    const queryString = new URLSearchParams(queryParams).toString();
  
    // Log the fetch URL to debug
    console.log('Fetching URL:', `${url}?${queryString}`);
  
    try {
      const response = await fetch(`${url}?${queryString}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Network response was not ok: ${errorText}`);
      }
      const reportData = await response.json();
      navigate('/report', { state: { reportType, reportData } });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };
  

  // Array to map month numbers to names
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const handleEmployeeChange = (e) => {
    const employeeName = e.target.value;
    setSelectedEmployeeName(employeeName);
    const selectedEmployee = employees.find(emp => `${emp.first_name} ${emp.last_name}` === employeeName);
    setEmployeeId(selectedEmployee ? selectedEmployee.employee_id : '');
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Time Card Reports</h2>

      {/* Select Report Type */}
      <div className="mb-3">
        <label htmlFor="reportType" className="form-label">Select Report Type:</label>
        <select id="reportType" className="form-select" value={reportType} onChange={e => setReportType(e.target.value)}>
          <option value="totalHours">Total Hours Worked by Employee</option>
          <option value="detailedTimecards">Detailed Timecards by Employee</option>
          <option value="absenteeism">Absenteeism Report</option>
          <option value="monthlySummary">Monthly Summary Report</option>
          <option value="employeeSummary">Employee Summary Report</option>
        </select>
      </div>

      {/* Inputs based on selected report type */}
      {reportType === 'totalHours' && (
        <div className="mb-3">
          <h3>Total Hours Worked by Employee</h3>
          <div className="row mb-2">
            <div className="col">
              <label htmlFor="selectedEmployeeName" className="form-label">Employee:</label>
              <select
                id="selectedEmployeeName"
                className="form-select"
                value={selectedEmployeeName || ''}
                onChange={handleEmployeeChange}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label htmlFor="startDate1" className="form-label">Start Date:</label>
              <input
                id="startDate1"
                type="date"
                className="form-control"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="endDate1" className="form-label">End Date:</label>
              <input
                id="endDate1"
                type="date"
                className="form-control"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="text-center">
            <button className="btn btn-primary mx-2" onClick={handleGenerateReport}>Generate Report</button>
            <button
              className="btn btn-success mx-2"
              onClick={() => handleExportCsv(`${API}/reports/totalHours?startDate=${startDate}&endDate=${endDate}`, 'total_hours_report')}
            >
              Export to CSV
            </button>
            <button className="btn btn-danger mx-2" onClick={resetForm}>Reset Form</button>
          </div>
        </div>
      )}

      {reportType === 'detailedTimecards' && (
        <div className="mb-3">
          <h3>Detailed Timecards by Employee</h3>
          <div className="row mb-2">
            <div className="col">
              <label htmlFor="selectedEmployeeName" className="form-label">Employee:</label>
              <select
                id="selectedEmployeeName"
                className="form-select"
                value={selectedEmployeeName || ''}
                onChange={handleEmployeeChange}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.employee_id} value={`${emp.first_name} ${emp.last_name}`}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label htmlFor="startDate2" className="form-label">Start Date:</label>
              <input
                id="startDate2"
                type="date"
                className="form-control"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="endDate2" className="form-label">End Date:</label>
              <input
                id="endDate2"
                type="date"
                className="form-control"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="text-center">
            <button className="btn btn-primary mx-2" onClick={handleGenerateReport}>Generate Report</button>
            <button
              className="btn btn-success mx-2"
              onClick={() => handleExportCsv(`${API}/reports/detailedTimecards?startDate=${startDate}&endDate=${endDate}`, 'detailed_timecards_report')}
            >
              Export to CSV
            </button>
            <button className="btn btn-danger mx-2" onClick={resetForm}>Reset Form</button>
          </div>
        </div>
      )}

      {reportType === 'absenteeism' && (
        <div className="mb-3">
          <h3>Absenteeism Report</h3>
          <div className="row mb-2">
            <div className="col">
              <label htmlFor="startDate3" className="form-label">Start Date:</label>
              <input
                id="startDate3"
                type="date"
                className="form-control"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="col">
              <label htmlFor="endDate3" className="form-label">End Date:</label>
              <input
                id="endDate3"
                type="date"
                className="form-control"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="text-center">
            <button className="btn btn-primary mx-2" onClick={handleGenerateReport}>Generate Report</button>
            <button
              className="btn btn-success mx-2"
              onClick={() => handleExportCsv(`${API}/reports/absenteeism?startDate=${startDate}&endDate=${endDate}`, 'absenteeism_report')}
            >
              Export to CSV
            </button>
            <button className="btn btn-danger mx-2" onClick={resetForm}>Reset Form</button>
          </div>
        </div>
      )}

      {reportType === 'monthlySummary' && (
        <div className="mb-3">
          <h3>Monthly Summary Report</h3>
          <div className="row mb-2">
            <div className="col">
              <label htmlFor="month" className="form-label">Month:</label>
              <select id="month" className="form-select" value={month.value} onChange={e => setMonth(monthOptions.find(m => m.value === e.target.value))}>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="col">
              <label htmlFor="year" className="form-label">Year:</label>
              <input
                id="year"
                type="number"
                className="form-control"
                value={year}
                onChange={e => setYear(e.target.value)}
              />
            </div>
          </div>
          <div className="text-center">
            <button className="btn btn-primary mx-2" onClick={handleGenerateReport}>Generate Report</button>
            <button
              className="btn btn-success mx-2"
              onClick={() => handleExportCsv(`${API}/reports/monthlySummary?month=${month.value}&year=${year}`, 'monthly_summary_report')}
            >
              Export to CSV
            </button>
            <button className="btn btn-danger mx-2" onClick={resetForm}>Reset Form</button>
          </div>
        </div>
      )}

      {reportType === 'employeeSummary' && (
        <div className="mb-3">
          <h3>Employee Summary Report</h3>
          <div className="row mb-2">
            <div className="col">
              <label htmlFor="selectedEmployeeName" className="form-label">Employee:</label>
              <select
                id="selectedEmployeeName"
                className="form-select"
                value={selectedEmployeeName || ''}
                onChange={handleEmployeeChange}
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.employee_id} value={`${emp.first_name} ${emp.last_name}`}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label htmlFor="period" className="form-label">Period:</label>
              <select id="period" className="form-select" value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="text-center">
            <button className="btn btn-primary mx-2" onClick={handleGenerateReport}>Generate Report</button>
            <button
              className="btn btn-success mx-2"
              onClick={() => handleExportCsv(`${API}/reports/employeeSummary?employeeId=${employeeId}&period=${period}`, 'employee_summary_report')}
            >
              Export to CSV
            </button>
            <button className="btn btn-danger mx-2" onClick={resetForm}>Reset Form</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimeCardReports;

