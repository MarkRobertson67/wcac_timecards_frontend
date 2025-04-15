/* Proprietary Software License
   Copyright (c) 2025 Mark Robertson
   See LICENSE.txt file for details. */

   import React, { useEffect, useState } from "react";
   import { useNavigate } from "react-router-dom";
   import { Table, Button, Spinner } from "react-bootstrap";
   import { auth } from "../../../firebase/firebaseConfig";
   import styles from "./Employees.module.css";
   

   const API = process.env.REACT_APP_API_URL;
   
   function Employees() {
     const navigate = useNavigate();
     const [employees, setEmployees] = useState([]);
     const [currentUser, setCurrentUser] = useState(null);
     const [isAdmin, setIsAdmin] = useState(false);
     const [isLoading, setIsLoading] = useState(true);
   
   
     // Fetch employee data based on `is_admin`
     const fetchEmployeeData = async () => {
       setIsLoading(true);
       try {
         const user = auth.currentUser; // Get current logged-in user
         if (!user) throw new Error("No authenticated user found.");
   
         const response = await fetch(`${API}/employees/firebase/${user.uid}`);
         if (!response.ok) throw new Error("Failed to fetch employee data.");
   
         const { data } = await response.json();
         //setCurrentUser(data);
         setCurrentUser(data);
         setIsAdmin(data.is_admin);
   
         if (data.is_admin) {
           // Fetch all employees if the user is an admin
           const allEmployeesResponse = await fetch(`${API}/employees`);
           if (!allEmployeesResponse.ok)
             throw new Error("Failed to fetch all employees.");
           const allEmployeesData = await allEmployeesResponse.json();
           setEmployees(allEmployeesData.data || []);
         } else {
           // Only fetch the logged-in user's profile
           setEmployees([data]);
         }
       } catch (error) {
         console.error("Error fetching employee data:", error);
       } finally {
         setIsLoading(false);
       }
     };
   
     // Fetch employees on component mount
     useEffect(() => {
       fetchEmployeeData();
     }, []);
   
   
     const renderEmployeeDetails = () => {
      if (isLoading) {
        return (
          <div className="text-center mt-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading employee data...</span>
            </Spinner>
          </div>
        );
      }
  
      if (!Array.isArray(employees) || employees.length === 0) {
        return <div className="text-center">No employee data available</div>;
      }
  
      return (
        <div className={styles.ePage}>
          <div className="mt-3" style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h4 className="text-center mb-3" style={{ fontSize: "2rem" }}>
              {isAdmin ? "All Employees" : "Your Profile"}
            </h4>
            <div className={styles.scrollableTable}>
              <Table
                striped
                bordered
                hover
                responsive="sm"
                size="sm"
                className={`text-center ${styles.table}`}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((record) => (
                    <tr key={record.id}>
                      <td>{record.first_name} {record.last_name}</td>
                      {isAdmin ? (
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/employee/${record.id}`)}
                          >
                            View Details
                          </Button>
                        </td>
                      ) : (
                        record.id === currentUser?.id && (
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`/employee/${record.id}`)}
                            >
                              Edit My Profile
                            </Button>
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      );
    };
  
    return <>{renderEmployeeDetails()}</>;
  }
  
  export default Employees;