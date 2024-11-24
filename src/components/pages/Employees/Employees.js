/* Proprietary Software License
   Copyright (c) 2024 Mark Robertson
   See LICENSE.txt file for details. */

   import React, { useEffect, useState } from 'react';
   import { useNavigate } from 'react-router-dom';
   import { Container, Table, Button, Spinner } from 'react-bootstrap';
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
         <div className={`${styles.container} mt-4`} style={{ paddingBottom: '50px', maxWidth: '600px', margin: '0 auto' }}>
           <h4 className="text-center mb-3" style={{ fontSize: '1rem' }}>All Employees</h4>
           <Table striped bordered hover responsive="sm" size="sm" className="text-center" style={{ fontSize: '0.8rem' }}>
             <thead>
               <tr>
                 <th>Name</th>
                 <th>Email</th>
                 <th>Actions</th>
               </tr>
             </thead>
             <tbody>
               {employees.map((record) => (
                 <tr key={record.id}>
                   <td>{record.first_name} {record.last_name}</td>
                   <td>{record.email}</td>
                   <td>
                     <Button
                       variant="primary"
                       size="sm"
                       onClick={() => navigate(`/employee/${record.id}`)}
                     >
                       View Details
                     </Button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </Table>
         </div>
       );
     };
   
     return (
       <Container className="mt-4">
         {renderEmployeeDetails()}
       </Container>
     );
   }
   
   export default Employees;
