// Proprietary Software License
// Copyright (c) 2025 Mark Robertson
// See LICENSE.txt file for details.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase/firebaseConfig";
import styles from "./TimeCardReports.module.css";

const API = process.env.REACT_APP_API_URL;

const monthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function TimeCardReports() {
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    reportType: "totalHours",
    startDate: "",
    endDate: "",
    employeeId: "",
    selectedEmployeeName: "",
    month: monthOptions[0],
    year: new Date().getFullYear().toString(), // Use the current year
    period: "weekly",
    employees: [],
  });

  const [isLoading, setIsLoading] = useState(false); // State for loading status
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    if (formState.employees.length > 0) {
      console.log("Employees updated after fetch:", formState.employees); // This log after the state updates
    }
  }, [formState.employees]);

  const handleChange = (e) => {
    const { id, value, type } = e.target;
    console.log(`Handling change for ${id} with value ${value}`);

    // Handle employee selection
    if (id === "selectedEmployeeName") {
      console.log(`Updating selectedEmployeeName to ${value}`); // Add a log for debugging
      setFormState((prevState) => ({
        ...prevState,
        selectedEmployeeName: value, // Update the form state
      }));
    } else if (id === "month") {
      // Handle month selection
      const selectedMonth = monthOptions.find(
        (option) => option.value === value
      );
      console.log(`Updating month to ${selectedMonth.label}`);
      setFormState((prevState) => ({
        ...prevState,
        [id]: selectedMonth,
      }));
    } else {
      // Handle other fields
      console.log(`Updating ${id} to ${value}`);
      setFormState((prevState) => ({
        ...prevState,
        [id]: type === "checkbox" ? value === "on" : value,
      }));
    }
  };

  const resetForm = () => {
    setFormState({
      reportType: "totalHours",
      startDate: "",
      endDate: "",
      employeeId: "",
      selectedEmployeeName: "",
      month: monthOptions[0],
      year: new Date().getFullYear().toString(), // Reset to the current year,
      period: "weekly",
      employees: [],
    });
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      // Fetch the logged-in user's details
      const userResponse = await fetch(`${API}/employees/firebase/${user.uid}`);
      const userData = await userResponse.json();
      if (userData?.data) {
        setIsAdmin(userData.data.is_admin);
        setCurrentUserId(userData.data.id); // Save the current user's ID
      }

      // Fetch all employees if the user is an admin
      if (userData.data.is_admin) {
        const allEmployeesResponse = await fetch(`${API}/employees`);
        const allEmployeesData = await allEmployeesResponse.json();
        setFormState((prevState) => ({
          ...prevState,
          employees: allEmployeesData.data || [],
        }));
      } else {
        // Set only the current user in employees for non-admins
        setFormState((prevState) => ({
          ...prevState,
          employees: [userData.data],
          selectedEmployeeName: `${userData.data.first_name} ${userData.data.last_name}`,
          employeeId: userData.data.id, // Automatically set the current user's ID
        }));
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleGenerateReport = async () => {
    const {
      reportType,
      startDate,
      endDate,
      selectedEmployeeName,
      employees,
      period,
    } = formState;

    // Check if 'ALL' employees is selected
    if (selectedEmployeeName === "ALL") {
      // Route for ALL employees
      if (reportType === "employeeSummary") {
        const url = `${API}/reports/all/employee-summary?startDate=${startDate}&endDate=${endDate}&period=${period}`;
        console.log(`Fetching employee summary for ALL employees from: ${url}`);

        // Fetching report for ALL employees
        try {
          const response = await fetch(`${url}`);
          const reportData = await response.json();
          const reportArray = Array.isArray(reportData.data)
            ? reportData.data
            : [];

          if (reportArray.length === 0) {
            console.log(
              "No timecards found for ALL employees. Generating default data."
            );
            const defaultReportData = [
              {
                start_date: startDate,
                end_date: endDate,
                employee_id: "ALL",
                total_hours: { hours: 0, minutes: 0 },
              },
            ];

            navigate("/report", {
              state: {
                reportType,
                reportData: defaultReportData,
                startDate,
                endDate,
                employeeId:
                  isAdmin && selectedEmployeeName === "ALL"
                    ? "ALL"
                    : currentUserId, // Use 'ALL' for admins selecting all employees
                isAdmin,
                currentUserId,
              },
            });
          } else {
            navigate("/report", {
              state: {
                reportType,
                reportData: reportArray,
                startDate,
                endDate,
                employeeId: "ALL",
              },
            });
          }
        } catch (error) {
          console.error("Error fetching report data for ALL employees:", error);
        }
      } else if (reportType === "totalHours") {
        const url = `${API}/reports/all/range/${startDate}/${endDate}`;
        console.log(`Fetching total hours for ALL employees from: ${url}`);

        // Fetching report for ALL employees
        try {
          const response = await fetch(`${url}`);
          const reportData = await response.json();
          const reportArray = Array.isArray(reportData.data)
            ? reportData.data
            : [];

          if (reportArray.length === 0) {
            console.log(
              "No timecards found for ALL employees. Generating default data."
            );
            const defaultReportData = [
              {
                start_date: startDate,
                end_date: endDate,
                employee_id: "ALL",
                facility_total_hours: { hours: 0, minutes: 0 },
                driving_total_hours: { hours: 0, minutes: 0 },
              },
            ];

            navigate("/report", {
              state: {
                reportType,
                reportData: defaultReportData,
                startDate,
                endDate,
                employeeId: "ALL",
              },
            });
          } else {
            navigate("/report", {
              state: {
                reportType,
                reportData: reportArray,
                startDate,
                endDate,
                employeeId: "ALL",
              },
            });
          }
        } catch (error) {
          console.error("Error fetching report data for ALL employees:", error);
        }
      } else {
        console.error("Invalid report type for ALL employees");
        return;
      }
    } else {
      // Validate employee selection and report fields
      if (!selectedEmployeeName || !startDate || !endDate) {
        alert(
          "Please select an employee, start date, and end date before generating the report."
        );
        return; // Prevent submission if fields are missing
      }

      // Logic for an individual employee
      const selectedEmployee = employees.find(
        (emp) =>
          `${emp.first_name} ${emp.last_name}`.trim() ===
          selectedEmployeeName.trim()
      );
      const empId = selectedEmployee ? selectedEmployee.id : null;

      if (!empId) {
        console.error("Invalid employee selected or employee ID not found");
        alert("Invalid employee selected. Please select a valid employee.");
        return;
      }

      // Set employeeId in the formState
      setFormState((prevState) => ({
        ...prevState,
        employeeId: empId,
      }));

      let url;
      let queryParams = {};

      switch (reportType) {
        case "totalHours":
          url = `${API}/reports/${empId}`;
          queryParams = { startDate, endDate };
          console.log(
            `Fetching total hours for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}`
          );
          break;

        case "detailedTimecards":
          url = `${API}/reports/detailed/${empId}`;
          queryParams = { startDate, endDate };
          console.log(
            `Fetching detailed timecards for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}`
          );
          break;

        case "employeeSummary":
          url = `${API}/reports/employee-summary/${empId}`;
          queryParams = { startDate, endDate, period };
          console.log(
            `Fetching employee summary for employee ID ${empId} from: ${url}?startDate=${startDate}&endDate=${endDate}&period=${period}`
          );
          break;

        default:
          console.error("Invalid report type for individual employee");
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
          const defaultReportData = [
            {
              start_date: startDate,
              end_date: endDate,
              employee_id: empId,
              first_name: selectedEmployee.first_name,
              last_name: selectedEmployee.last_name,
              facility_total_hours: { hours: 0, minutes: 0 },
              driving_total_hours: { hours: 0, minutes: 0 },
            },
          ];

          navigate("/report", {
            state: {
              reportType,
              reportData: defaultReportData,
              startDate,
              endDate,
              employeeId: empId,
              firstName: selectedEmployee.first_name,
              lastName: selectedEmployee.last_name,
            },
          });
        } else {
          navigate("/report", {
            state: {
              reportType,
              reportData: reportArray,
              startDate,
              endDate,
              employeeId: empId,
              firstName: selectedEmployee.first_name,
              lastName: selectedEmployee.last_name,
              period,
            },
          });
        }
      } catch (error) {
        console.error(
          "Error fetching report data for individual employee:",
          error
        );
      }
    }
  };


  return (
    <div className={styles.tcrPage}>
      <div className="container mt-4 pt-4" style={{ maxWidth: "500px" }}>
        <h2 className="text-center mb-4">Time Card Reports</h2>
  
        {isLoading ? (
          <div className="text-center mt-4">
            <div className="spinner-border custom-spinner" role="status"></div>
            <div className="mt-2">Loading employee data...</div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <label htmlFor="reportType" className="form-label">
                Select Report Type:
              </label>
              <select
                id="reportType"
                className="form-select"
                value={formState.reportType}
                onChange={handleChange}
              >
                <option value="totalHours">Total Hours Worked by Employee</option>
                <option value="detailedTimecards">Detailed Timecards by Employee</option>
                <option value="employeeSummary">Employee Summary Report</option>
              </select>
            </div>
  
            {["totalHours", "detailedTimecards", "employeeSummary"].includes(formState.reportType) && (
              <>
                <div className="mb-3">
                  <label htmlFor="selectedEmployeeName" className="form-label">Employee:</label>
                  <select
                    id="selectedEmployeeName"
                    className="form-select"
                    value={formState.selectedEmployeeName || ""}
                    onChange={handleChange}
                    disabled={isLoading}
                    style={{
                      backgroundColor: isLoading ? "#e9ecef" : "",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    <option value="">Select Employee</option>
                    {formState.reportType !== "detailedTimecards" && isAdmin && (
                      <option value="ALL">ALL</option>
                    )}
                    {formState.employees.map((emp) => (
                      <option key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>
  
                <div className="mb-3">
                  <label htmlFor="startDate" className="form-label">Start Date:</label>
                  <input
                    id="startDate"
                    type="date"
                    className="form-control"
                    value={formState.startDate}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
  
                <div className="mb-3">
                  <label htmlFor="endDate" className="form-label">End Date:</label>
                  <input
                    id="endDate"
                    type="date"
                    className="form-control"
                    value={formState.endDate}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
  
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "16px",
              }}
            >
              <button
                className="btn btn-primary"
                onClick={handleGenerateReport}
                disabled={isLoading}
                style={{ padding: "6px 14px", width: "auto" }}
              >
                {isLoading ? "Loading..." : "Generate Report"}
              </button>
  
              <button
                className="btn btn-danger"
                onClick={resetForm}
                disabled={isLoading}
                style={{ padding: "6px 14px", width: "auto" }}
              >
                {isLoading ? "Loading..." : "Reset"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
  
}

export default TimeCardReports;
