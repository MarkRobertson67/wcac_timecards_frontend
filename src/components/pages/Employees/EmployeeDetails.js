/* Proprietary Software License
   Copyright (c) 2024 Mark Robertson
   See LICENSE.txt file for details. */

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Card,
} from "react-bootstrap";
import { auth } from "../../../firebase/firebaseConfig";
import styles from "./EmployeeDetails.module.css";

const API = process.env.REACT_APP_API_URL;

function EmployeeDetails() {
  const { id } = useParams(); // Get employee ID from URL
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employee details based on ID
  const fetchEmployee = useCallback(async () => {
    setIsLoading(true);

    try {
      const user = auth.currentUser; // Get current user
      if (!user) throw new Error("User not authenticated.");

      // Fetch the current user's profile to determine admin status
      const userResponse = await fetch(`${API}/employees/firebase/${user.uid}`);
      const userData = await userResponse.json();
      if (userData?.data) {
        setIsAdmin(userData.data.is_admin);
      }

      // Fetch employee details
      const response = await fetch(`${API}/employees/${id}`);
      if (!response.ok) throw new Error("Failed to fetch employee details");

      const data = await response.json();
      if (data && data.data) {
        setEmployee(data.data);
      } else {
        console.error("Unexpected response data:", data);
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch employee details on component mount or when `id` changes
  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent changing is_admin to false for the protected admin account
    if (name === "is_admin" && employee.id === 1 && value === "false") {
      alert("Admin privileges cannot be removed for this account.");
      return;
    }

    setEmployee((prevEmployee) => ({
      ...prevEmployee,
      [name]: name === "is_admin" ? value === "true" : value,
    }));
  };

  const handleSave = async () => {
    try {
      // Prevent saving changes for the primary admin account (ID = 1)
      if (employee.id === 1 && employee.is_admin === false) {
        alert(
          "The primary admin account cannot have admin privileges removed."
        );
        return;
      }

      // Confirm the save operation
      if (!window.confirm("Are you sure you want to save these changes?")) {
        return;
      }

      const dataToUpdate = isAdmin
        ? employee // Admins can update everything
        : {
            first_name: employee.first_name,
            last_name: employee.last_name,
            phone: employee.phone,
            email: employee.email,
          }; // Non-admins can only update non-sensitive info (name, phone)


      const response = await fetch(`${API}/employees/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToUpdate),
      });

      if (!response.ok) {
        throw new Error("Failed to update employee details");
      }

      alert("Employee details updated successfully!");
    } catch (error) {
      console.error("Error updating employee details:", error);
      alert("Failed to update employee details.");
    }
  };

  const handleDelete = async () => {
    if (employee.id === 1) {
      alert("The primary admin account cannot be deleted.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        const response = await fetch(`${API}/employees/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete employee");
        }
        alert("Employee deleted successfully!");
        navigate("/employees");
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete employee.");
      }
    }
  };

  // Check if the employee is the protected admin account (ID = 1)
  const isProtectedAdminAccount = employee?.id === 1;

  if (isLoading) {
    return (
      <div className="text-center mt-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading employee details...</span>
        </Spinner>
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center">No employee details available</div>;
  }

  return (
    <div className={styles.edPage}>
      <Container
        className="mt-4 d-flex justify-content-center"
        style={{ paddingBottom: "100px" }}
      >
        <Card
          style={{
            width: window.innerWidth < 600 ? "100%" : "800px",
            padding: "15px",
            overflowY: "auto",
          }}
        >
          <Card.Body style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
            <h4 className="text-center mb-4">
              Employee Details for {employee.first_name} {employee.last_name}
            </h4>
            <Form>
              <Row className="mb-2">
                <Col xs={12} md={6}>
                  <Form.Group controlId="first_name">
                    <Form.Label className="small-text">First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={employee.first_name}
                      onChange={handleChange}
                      size="sm"
                      disabled={isProtectedAdminAccount} // Disable for admin account
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="last_name">
                    <Form.Label className="small-text">Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={employee.last_name}
                      onChange={handleChange}
                      size="sm"
                      disabled={isProtectedAdminAccount} // Disable for admin account
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-2">
                <Col xs={12} md={6}>
                  <Form.Group controlId="email">
                    <Form.Label className="small-text">Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={employee.email}
                      size="sm"
                      disabled // Email cannot be changed
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="phone">
                    <Form.Label className="small-text">Phone</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={employee.phone || ""}
                      onChange={handleChange}
                      size="sm"
                    />
                  </Form.Group>
                </Col>
              </Row>
              {isAdmin && (
                <>
                  <Row className="mb-2">
                    <Col xs={12} md={6}>
                      <Form.Group controlId="firebase_uid">
                        <Form.Label className="small-text">
                          Firebase UID
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="firebase_uid"
                          value={employee.firebase_uid}
                          size="sm"
                          disabled // Firebase UID should not be editable
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group controlId="paychex_id">
                        <Form.Label className="small-text">
                          Paychex ID
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="paychex_id"
                          value={employee.paychex_id || ""}
                          onChange={handleChange}
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col xs={12} md={6}>
                      <Form.Group controlId="position">
                        <Form.Label className="small-text">Position</Form.Label>
                        <Form.Control
                          type="text"
                          name="position"
                          value={employee.position || ""}
                          onChange={handleChange}
                          size="sm"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group controlId="is_admin">
                        <Form.Label className="small-text">
                          Admin Privileges
                        </Form.Label>
                        <Form.Select
                          name="is_admin"
                          value={employee.is_admin ? "true" : "false"}
                          onChange={handleChange}
                          size="sm"
                          disabled={isProtectedAdminAccount} // Disable admin modification for protected account
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Col xs={12} md={6}>
                    <Form.Group controlId="employee_id">
                      <Form.Label className="small-text">
                        Employee ID
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="employee_id"
                        value={employee.id || ""}
                        size="sm"
                        disabled // Employee ID should not be editable
                      />
                    </Form.Group>
                  </Col>
                </>
              )}
            </Form>
            <div className="text-center mt-3">
              <Button
                variant="primary"
                size="sm"
                className="mx-1"
                onClick={handleSave} // Now Save button should work for admin
              >
                Save Changes
              </Button>
              {isAdmin && (
                <Button
                  variant="danger"
                  size="sm"
                  className="mx-1"
                  onClick={handleDelete} // Now Delete button should work for admin
                >
                  Delete Employee
                </Button>
              )}
              <Button
                variant="dark"
                size="sm"
                className="mx-1"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default EmployeeDetails;
