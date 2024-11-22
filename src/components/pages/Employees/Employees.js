/* Proprietary Software License
   Copyright (c) 2024 Mark Robertson
   See LICENSE.txt file for details. */

   import React, { useEffect, useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import styles from "./Employee.module.css";
   
   const API = process.env.REACT_APP_API_URL;
   
   function Employees() {
     const navigate = useNavigate();
     const [employees, setEmployees] = useState([]);
     const [isLoading, setIsLoading] = useState(true);
   
     // Function to fetch all employees
     const fetchEmployees = async () => {
       setIsLoading(true);
   
       try {
         const response = await fetch(`${API}/employees`);
   
         if (!response.ok) {
           throw new Error("Failed to fetch employees");
         }
   
         const data = await response.json();
         if (data && data.data) {
           setEmployees(data.data);
         } else {
           console.error("Unexpected response data:", data);
         }
       } catch (error) {
         console.error("Error fetching employees:", error);
       } finally {
         setIsLoading(false);
       }
     };
   
     // Fetch employees on component mount
     useEffect(() => {
       fetchEmployees();
     }, []);
   
     const renderEmployeeDetails = () => {
       if (isLoading) {
         return (
           <div className="text-center mt-4">
             <div className="spinner-border custom-spinner" role="status">
               <span className="visually-hidden">Loading employee data...</span>
             </div>
           </div>
         );
       }
   
       if (!Array.isArray(employees) || employees.length === 0) {
         return <div className="text-center">No employee data available</div>;
       }
   
       return (
         <div className={`${styles.container} mt-4`}>
           <h2 className="text-center mb-4">All Employees</h2>
           <table className="table table-striped table-bordered text-center">
             <thead>
               <tr>
                 <th>First Name</th>
                 <th>Last Name</th>
                 <th>Email</th>
                 <th>Phone</th>
                 <th>Position</th>
                 <th>Admin</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {employees.map((record) => (
                 <tr key={record.id}>
                   <td>{record.first_name}</td>
                   <td>{record.last_name}</td>
                   <td>{record.email}</td>
                   <td>{record.phone}</td>
                   <td>{record.position}</td>
                   <td>{record.is_admin ? 'Yes' : 'No'}</td>
                   <td>
                     <button
                       className="btn btn-primary"
                       onClick={() => navigate(`/employee/${record.id}`)}
                     >
                       View Details
                     </button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       );
     };
   
     return (
       <div className="container mt-4">
         {renderEmployeeDetails()}
       </div>
     );
   }
   
   export default Employees;
   
   
   