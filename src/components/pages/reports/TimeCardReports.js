// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL;

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

function TimeCardReports() {
  
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    reportType: 'totalHours',
    startDate: '',
    endDate: '',
    employeeId: '',
    selectedEmployeeName: '',
    month: monthOptions[0],
    year: '2024',
    period: 'weekly',
    employees: []
  });

  const handleChange = (e) => {
    const { id, value, type } = e.target;

    console.log(`Handling change for ${id} with value ${value}`);

    
    if (id === 'month') {
      // Find the selected month option
      const selectedMonth = monthOptions.find(option => option.value === value);
      console.log(`Updating month to ${selectedMonth.label}`);
      setFormState(prevState => ({
        ...prevState,
        [id]: selectedMonth
      }));
    } else {
      console.log(`Updating ${id} to ${value}`);
      setFormState(prevState => ({
        ...prevState,
        [id]: type === 'checkbox' ? value === 'on' : value
      }));
    }
  };

  const resetForm = () => {
    setFormState({
      reportType: 'totalHours',
      startDate: '',
      endDate: '',
      employeeId: '',
      selectedEmployeeName: '',
      month: monthOptions[0],
      year: '2024',
      period: 'weekly',
      employees: []
    });
  };

  const fetchEmployees = async () => {
    try {
        const response = await fetch(`${API}/employees`);
        if (!response.ok) {
            throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        if (data && data.data) {
            setFormState(prevState => ({ ...prevState, employees: data.data }));
        } else {
            console.error('Unexpected response data:', data);
        }
    } catch (error) {
        console.error('Error fetching employees:', error);
    }
};

useEffect(() => {
    fetchEmployees();
}, []); // Empty dependency array to run only once on component mount


 
  


  const handleGenerateReport = async () => {
  let url;
  let queryParams = {};
  
  const { reportType, startDate, endDate, month, year, selectedEmployeeName, employees } = formState;
  
  const selectedEmployee = employees.find(emp => `${emp.first_name} ${emp.last_name}`.trim() === selectedEmployeeName.trim());
  const empId = selectedEmployee ? selectedEmployee.id : null;

  if (!empId && ['totalHours', 'detailedTimecards', 'employeeSummary'].includes(reportType)) {
    console.error('Invalid employee selected or employee ID not found');
    return;
  }

  switch (reportType) {
    case 'totalHours':
      url = `${API}/reports/${empId}`;
      queryParams = { startDate, endDate };
      console.log(`Start Date: ${formState.startDate}`);
console.log(`End Date: ${formState.endDate}`);

      break;
    case 'detailedTimecards':
      url = `${API}/reports/detailed/${empId}`;
      queryParams = { startDate, endDate };
      console.log({ startDate, endDate })
      break;
    case 'monthlySummary':
      url = `${API}/reports/monthly-summary`;
      queryParams = { month: month ? Number(month.value) : '', year };  // Convert month to a number
      break;
    case 'employeeSummary':
      url = `${API}/reports/employee-summary`;
      queryParams = { employeeId: empId, startDate, endDate };
      break;
    default:
      console.error('Invalid report type');
      return;
  }

  const queryString = new URLSearchParams(queryParams).toString();
  console.log(`Fetching report from: ${url}?${queryString}`);

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


  const renderFormFields = () => {
    const { reportType, startDate, endDate, month, year, selectedEmployeeName, employees } = formState;

    switch (reportType) {
      case 'totalHours':
      case 'detailedTimecards':
      case 'employeeSummary':
        return (
          <>
            <div className="row mb-2">
              <div className="col">
                <label htmlFor="selectedEmployeeName" className="form-label">Employee:</label>
                <select
                  id="selectedEmployeeName"
                  className="form-select"
                  value={selectedEmployeeName || ''}
                  onChange={handleChange}
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
                <label htmlFor="startDate" className="form-label">Start Date:</label>
                <input
                  id="startDate"
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="col">
                <label htmlFor="endDate" className="form-label">End Date:</label>
                <input
                  id="endDate"
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </>
        );

      case 'monthlySummary':
        return (
          <div className="row mb-2">
            <div className="col">
              <label htmlFor="month" className="form-label">Month:</label>
              <select id="month" className="form-select" value={month.value} onChange={handleChange}>
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
                onChange={handleChange}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Time Card Reports</h2>

      <div className="mb-3">
        <label htmlFor="reportType" className="form-label">Select Report Type:</label>
        <select id="reportType" className="form-select" value={formState.reportType} onChange={handleChange}>
          <option value="totalHours">Total Hours Worked by Employee</option>
          <option value="detailedTimecards">Detailed Timecards by Employee</option>
          <option value="monthlySummary">Monthly Summary Report</option>
          <option value="employeeSummary">Employee Summary Report</option>
        </select>
      </div>

      {renderFormFields()}

      <div className="text-center">
        <button className="btn btn-primary mx-2" onClick={handleGenerateReport}>Generate Report</button>
        <button className="btn btn-secondary mx-2" onClick={resetForm}>Reset</button>
      </div>
    </div>
  );
}

export default TimeCardReports;
