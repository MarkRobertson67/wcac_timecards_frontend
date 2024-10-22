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
    year: new Date().getFullYear().toString(), // Use the current year
    period: 'weekly',
    employees: []
  });
  
  useEffect(() => {
    if (formState.employees.length > 0) {
      console.log("Employees updated after fetch:", formState.employees);  // This log after the state updates
    }
  }, [formState.employees]);
  

  const handleChange = (e) => {
    const { id, value, type } = e.target;
    console.log(`Handling change for ${id} with value ${value}`);

    // Handle employee selection
    if (id === 'selectedEmployeeName') {
      console.log(`Updating selectedEmployeeName to ${value}`);  // Add a log for debugging
      setFormState(prevState => ({
        ...prevState,
        selectedEmployeeName: value  // Update the form state
      }));
    } else if (id === 'month') {
      // Handle month selection
      const selectedMonth = monthOptions.find(option => option.value === value);
      console.log(`Updating month to ${selectedMonth.label}`);
      setFormState(prevState => ({
        ...prevState,
        [id]: selectedMonth
      }));
    } else {
      // Handle other fields
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
      year: new Date().getFullYear().toString(), // Reset to the current year,
      period: 'weekly',
      employees: []
    });
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API}/employees?ts=${new Date().getTime()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      if (data && data.data) {

        setFormState(prevState => ({ ...prevState, employees: data.data }));
        console.log("Fetched employees:", data.data);  // Log the fetched employees
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



//   const handleGenerateReport = async () => {
//     let url;
//     let queryParams = {};

//     const { reportType, startDate, endDate, selectedEmployeeName, employees, period } = formState;


//     // Check if 'ALL' employees is selected
//     if (selectedEmployeeName === "ALL") {
//         // Route for ALL employees
//         if (reportType === 'employeeSummary') {
//             url = `${API}/reports/all/employee-summary?startDate=${startDate}&endDate=${endDate}&period=${period}`;
//             console.log(`Fetching employee summary for ALL employees from: ${url}`);
//         } else if (reportType === 'totalHours') {
//             url = `${API}/reports/all/range/${startDate}/${endDate}`;
//             console.log(`Fetching total hours for ALL employees from: ${url}`);
//         } else {
//             console.error('Invalid report type for ALL employees');
//             return;
//         }

//         // Fetching report for ALL employees
//         try {
//             const response = await fetch(`${url}`);
//             const reportData = await response.json();

//             // Ensure reportData.data is an array
//             const reportArray = Array.isArray(reportData.data) ? reportData.data : [];

//             if (reportArray.length === 0) {
//                 console.log("No timecards found for ALL employees. Generating default data.");
//                 const defaultReportData = [{
//                     start_date: startDate,
//                     end_date: endDate,
//                     employee_id: 'ALL',
//                     total_hours: { hours: 0, minutes: 0 }
//                 }];

//                 navigate('/report', {
//                     state: {
//                         reportType,
//                         reportData: defaultReportData,
//                         startDate,
//                         endDate,
//                         employeeId: 'ALL',
//                     }
//                 });
//             } else {
//                 navigate('/report', {
//                     state: {
//                         reportType,
//                         reportData: reportArray,
//                         startDate,
//                         endDate,
//                         employeeId: 'ALL',
//                     }
//                 });
//             }
//         } catch (error) {
//             console.error('Error fetching report data for ALL employees:', error);
//         }

//     } else {
//         // Logic for an individual employee
//         const selectedEmployee = employees.find(emp => `${emp.first_name} ${emp.last_name}`.trim() === selectedEmployeeName.trim());
//         const empId = selectedEmployee ? selectedEmployee.id : null;

//         if (!empId) {
//             console.error('Invalid employee selected or employee ID not found');
//             return;
//         }

//         // Set employeeId in the formState
//         setFormState(prevState => ({
//             ...prevState,
//             employeeId: empId
//         }));

//         switch (reportType) {
//             case 'totalHours':
//                 url = `${API}/reports/${empId}`;
//                 queryParams = { startDate, endDate };
//                 console.log(`Fetching total hours for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}`);
//                 break;

//             case 'detailedTimecards':
//                 url = `${API}/reports/detailed/${empId}`;
//                 queryParams = { startDate, endDate };
//                 console.log(`Fetching detailed timecards for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}`);
//                 break;

//             case 'employeeSummary':
//                 url = `${API}/reports/employee-summary/${empId}`;
//                 queryParams = { startDate, endDate, period };
//                 console.log(`Fetching employee summary for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}&period=${period}`);
//                 break;

//             default:
//                 console.error('Invalid report type for individual employee');
//                 return;
//         }

//         const queryString = new URLSearchParams(queryParams).toString();
//         console.log(`Fetching report from: ${url}?${queryString}`);

//         try {
//             const response = await fetch(`${url}?${queryString}`);
//             const reportData = await response.json();

//             // Ensure reportData is an array
//             const reportArray = Array.isArray(reportData) ? reportData : [];

//             if (reportArray.length === 0) {
//                 console.log("No timecards found. Generating default data.");
//                 const defaultReportData = [{
//                     start_date: startDate,
//                     end_date: endDate,
//                     employee_id: empId,
//                     first_name: selectedEmployee.first_name,
//                     last_name: selectedEmployee.last_name,
//                     total_hours: { hours: 0, minutes: 0 }
//                 }];

//                 navigate('/report', {
//                     state: {
//                         reportType,
//                         reportData: defaultReportData,
//                         startDate,
//                         endDate,
//                         employeeId: empId,
//                         firstName: selectedEmployee.first_name,
//                         lastName: selectedEmployee.last_name
//                     }
//                 });
//             } else {
//                 navigate('/report', {
//                     state: {
//                         reportType,
//                         reportData: reportArray,
//                         startDate,
//                         endDate,
//                         employeeId: empId,
//                         firstName: selectedEmployee.first_name,
//                         lastName: selectedEmployee.last_name,
//                         period
//                     }
//                 });
//             }
//         } catch (error) {
//             console.error('Error fetching report data for individual employee:', error);
//         }
//     }

// };

const handleGenerateReport = async () => {
  const { reportType, startDate, endDate, selectedEmployeeName, employees, period } = formState;

  // Check if 'ALL' employees is selected
  if (selectedEmployeeName === "ALL") {
      // Route for ALL employees
      if (reportType === 'employeeSummary') {
          const url = `${API}/reports/all/employee-summary?startDate=${startDate}&endDate=${endDate}&period=${period}`;
          console.log(`Fetching employee summary for ALL employees from: ${url}`);

          // Fetching report for ALL employees
          try {
              const response = await fetch(`${url}`);
              const reportData = await response.json();
              const reportArray = Array.isArray(reportData.data) ? reportData.data : [];

              if (reportArray.length === 0) {
                  console.log("No timecards found for ALL employees. Generating default data.");
                  const defaultReportData = [{
                      start_date: startDate,
                      end_date: endDate,
                      employee_id: 'ALL',
                      total_hours: { hours: 0, minutes: 0 }
                  }];

                  navigate('/report', {
                      state: {
                          reportType,
                          reportData: defaultReportData,
                          startDate,
                          endDate,
                          employeeId: 'ALL',
                      }
                  });
              } else {
                  navigate('/report', {
                      state: {
                          reportType,
                          reportData: reportArray,
                          startDate,
                          endDate,
                          employeeId: 'ALL',
                      }
                  });
              }
          } catch (error) {
              console.error('Error fetching report data for ALL employees:', error);
          }

      } else if (reportType === 'totalHours') {
          const url = `${API}/reports/all/range/${startDate}/${endDate}`;
          console.log(`Fetching total hours for ALL employees from: ${url}`);

          // Fetching report for ALL employees
          try {
              const response = await fetch(`${url}`);
              const reportData = await response.json();
              const reportArray = Array.isArray(reportData.data) ? reportData.data : [];

              if (reportArray.length === 0) {
                  console.log("No timecards found for ALL employees. Generating default data.");
                  const defaultReportData = [{
                      start_date: startDate,
                      end_date: endDate,
                      employee_id: 'ALL',
                      total_hours: { hours: 0, minutes: 0 }
                  }];

                  navigate('/report', {
                      state: {
                          reportType,
                          reportData: defaultReportData,
                          startDate,
                          endDate,
                          employeeId: 'ALL',
                      }
                  });
              } else {
                  navigate('/report', {
                      state: {
                          reportType,
                          reportData: reportArray,
                          startDate,
                          endDate,
                          employeeId: 'ALL',
                      }
                  });
              }
          } catch (error) {
              console.error('Error fetching report data for ALL employees:', error);
          }

      } else {
          console.error('Invalid report type for ALL employees');
          return;
      }

  } else {
      // Validate employee selection and report fields
      if (!selectedEmployeeName || !startDate || !endDate) {
          alert("Please select an employee, start date, and end date before generating the report.");
          return; // Prevent submission if fields are missing
      }

      // Logic for an individual employee
      const selectedEmployee = employees.find(emp => `${emp.first_name} ${emp.last_name}`.trim() === selectedEmployeeName.trim());
      const empId = selectedEmployee ? selectedEmployee.id : null;

      if (!empId) {
          console.error('Invalid employee selected or employee ID not found');
          alert("Invalid employee selected. Please select a valid employee.");
          return;
      }

      // Set employeeId in the formState
      setFormState(prevState => ({
          ...prevState,
          employeeId: empId
      }));

      let url;
      let queryParams = {};

      switch (reportType) {
          case 'totalHours':
              url = `${API}/reports/${empId}`;
              queryParams = { startDate, endDate };
              console.log(`Fetching total hours for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}`);
              break;

          case 'detailedTimecards':
              url = `${API}/reports/detailed/${empId}`;
              queryParams = { startDate, endDate };
              console.log(`Fetching detailed timecards for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}`);
              break;

          case 'employeeSummary':
              url = `${API}/reports/employee-summary/${empId}`;
              queryParams = { startDate, endDate, period };
              console.log(`Fetching employee summary for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}&period=${period}`);
              break;

          default:
              console.error('Invalid report type for individual employee');
              return;
      }

      const queryString = new URLSearchParams(queryParams).toString();
      console.log(`Fetching report from: ${url}?${queryString}`);

      try {
          const response = await fetch(`${url}?${queryString}`);
          const reportData = await response.json();
          const reportArray = Array.isArray(reportData) ? reportData : [];

          if (reportArray.length === 0) {
              console.log("No timecards found. Generating default data.");
              const defaultReportData = [{
                  start_date: startDate,
                  end_date: endDate,
                  employee_id: empId,
                  first_name: selectedEmployee.first_name,
                  last_name: selectedEmployee.last_name,
                  total_hours: { hours: 0, minutes: 0 }
              }];

              navigate('/report', {
                  state: {
                      reportType,
                      reportData: defaultReportData,
                      startDate,
                      endDate,
                      employeeId: empId,
                      firstName: selectedEmployee.first_name,
                      lastName: selectedEmployee.last_name
                  }
              });
          } else {
              navigate('/report', {
                  state: {
                      reportType,
                      reportData: reportArray,
                      startDate,
                      endDate,
                      employeeId: empId,
                      firstName: selectedEmployee.first_name,
                      lastName: selectedEmployee.last_name,
                      period
                  }
              });
          }
      } catch (error) {
          console.error('Error fetching report data for individual employee:', error);
      }
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

                  {/* Only show "ALL" option if the report type is not detailedTimecards */}
                  {reportType !== 'detailedTimecards' && (
                    <option value="ALL">ALL</option>
                  )}

                  {/* Map individual employee names */}
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
