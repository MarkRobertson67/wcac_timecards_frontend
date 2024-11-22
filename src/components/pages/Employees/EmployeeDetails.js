/* Proprietary Software License
   Copyright (c) 2024 Mark Robertson
   See LICENSE.txt file for details. */


import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Spinner, Card } from 'react-bootstrap';

const API = process.env.REACT_APP_API_URL;

function EmployeeDetails() {
  const { id } = useParams(); // Get employee ID from URL
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch employee details based on ID
  const fetchEmployee = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API}/employees/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch employee details");
      }

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
    setEmployee((prevEmployee) => ({
      ...prevEmployee,
      [name]: name === 'is_admin' ? value === 'true' : value,
    }));
  };

  const handleSave = async () => {
    if (window.confirm('Are you sure you want to save these changes?')) {
      try {
        const response = await fetch(`${API}/employees/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(employee),
        });

        if (!response.ok) {
          throw new Error('Failed to update employee details');
        }
        alert('Employee details updated successfully!');
      } catch (error) {
        console.error('Error updating employee details:', error);
        alert('Failed to update employee details.');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API}/employees/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete employee');
        }
        alert('Employee deleted successfully!');
        navigate('/employees');
      } catch (error) {
        console.error('Error deleting employee:', error);
        alert('Failed to delete employee.');
      }
    }
  };

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
    <Container className="mt-4 d-flex justify-content-center" style={{ paddingBottom: '100px' }}>
      <Card style={{ width: window.innerWidth < 600 ? '100%' : '800px', padding: '15px' }}>
        <Card.Body>
          <h4 className="text-center mb-4">Employee Details for {employee.first_name} {employee.last_name}</h4>
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
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="phone">
                  <Form.Label className="small-text">Phone</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={employee.phone}
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
                    value={employee.position}
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="paychex_id">
                  <Form.Label className="small-text">Paychex ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="paychex_id"
                    value={employee.paychex_id || ''}
                    onChange={handleChange}
                    size="sm"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-2">
              <Col xs={12} md={6}>
                <Form.Group controlId="is_admin">
                  <Form.Label className="small-text">Admin Privileges</Form.Label>
                  <Form.Select
                    name="is_admin"
                    value={employee.is_admin ? 'true' : 'false'}
                    onChange={handleChange}
                    size="sm"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
          <div className="text-center mt-3">
            <Button variant="primary" size="sm" className="mx-1" onClick={handleSave}>Save Changes</Button>
            <Button variant="danger" size="sm" className="mx-1" onClick={handleDelete}>Delete Employee</Button>
            <Button variant="dark" size="sm" className="mx-1" onClick={() => navigate(-1)}>Back</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default EmployeeDetails;

   
   
   


//    import React, { useEffect, useState, useCallback } from 'react';
//    import { useParams, useNavigate } from 'react-router-dom';
//    import { Container, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
   
//    const API = process.env.REACT_APP_API_URL;
   
//    function EmployeeDetails() {
//      const { id } = useParams(); // Get employee ID from URL
//      const navigate = useNavigate();
//      const [employee, setEmployee] = useState(null);
//      const [isLoading, setIsLoading] = useState(true);
   
//      // Fetch employee details based on ID
//      const fetchEmployee = useCallback(async () => {
//        setIsLoading(true);
   
//        try {
//          const response = await fetch(`${API}/employees/${id}`);
//          if (!response.ok) {
//            throw new Error("Failed to fetch employee details");
//          }
   
//          const data = await response.json();
//          if (data && data.data) {
//            setEmployee(data.data);
//          } else {
//            console.error("Unexpected response data:", data);
//          }
//        } catch (error) {
//          console.error("Error fetching employee details:", error);
//        } finally {
//          setIsLoading(false);
//        }
//      }, [id]);
   
//      // Fetch employee details on component mount or when `id` changes
//      useEffect(() => {
//        fetchEmployee();
//      }, [fetchEmployee]);
   
//      const handleChange = (e) => {
//        const { name, value } = e.target;
//        setEmployee((prevEmployee) => ({
//          ...prevEmployee,
//          [name]: name === 'is_admin' ? value === 'true' : value,
//        }));
//      };
   
//      const handleSave = async () => {
//        try {
//          const response = await fetch(`${API}/employees/${id}`, {
//            method: 'PUT',
//            headers: {
//              'Content-Type': 'application/json',
//            },
//            body: JSON.stringify(employee),
//          });
   
//          if (!response.ok) {
//            throw new Error('Failed to update employee details');
//          }
//          alert('Employee details updated successfully!');
//        } catch (error) {
//          console.error('Error updating employee details:', error);
//          alert('Failed to update employee details.');
//        }
//      };
   
//      if (isLoading) {
//        return (
//          <div className="text-center mt-4">
//            <Spinner animation="border" role="status">
//              <span className="visually-hidden">Loading employee details...</span>
//            </Spinner>
//          </div>
//        );
//      }
   
//      if (!employee) {
//        return <div className="text-center">No employee details available</div>;
//      }
   
//      return (
//        <Container className="mt-4">
//          <h2 className="text-center mb-4">Employee Details for {employee.first_name} {employee.last_name}</h2>
//          <Form>
//            <Row className="mb-3">
//              <Col md={6}>
//                <Form.Group controlId="first_name">
//                  <Form.Label>First Name</Form.Label>
//                  <Form.Control
//                    type="text"
//                    name="first_name"
//                    value={employee.first_name}
//                    onChange={handleChange}
//                  />
//                </Form.Group>
//              </Col>
//              <Col md={6}>
//                <Form.Group controlId="last_name">
//                  <Form.Label>Last Name</Form.Label>
//                  <Form.Control
//                    type="text"
//                    name="last_name"
//                    value={employee.last_name}
//                    onChange={handleChange}
//                  />
//                </Form.Group>
//              </Col>
//            </Row>
//            <Row className="mb-3">
//              <Col md={6}>
//                <Form.Group controlId="email">
//                  <Form.Label>Email</Form.Label>
//                  <Form.Control
//                    type="email"
//                    name="email"
//                    value={employee.email}
//                    onChange={handleChange}
//                  />
//                </Form.Group>
//              </Col>
//              <Col md={6}>
//                <Form.Group controlId="phone">
//                  <Form.Label>Phone</Form.Label>
//                  <Form.Control
//                    type="text"
//                    name="phone"
//                    value={employee.phone}
//                    onChange={handleChange}
//                  />
//                </Form.Group>
//              </Col>
//            </Row>
//            <Row className="mb-3">
//              <Col md={6}>
//                <Form.Group controlId="position">
//                  <Form.Label>Position</Form.Label>
//                  <Form.Control
//                    type="text"
//                    name="position"
//                    value={employee.position}
//                    onChange={handleChange}
//                  />
//                </Form.Group>
//              </Col>
//              <Col md={6}>
//                <Form.Group controlId="paychex_id">
//                  <Form.Label>Paychex ID</Form.Label>
//                  <Form.Control
//                    type="text"
//                    name="paychex_id"
//                    value={employee.paychex_id || ''}
//                    onChange={handleChange}
//                  />
//                </Form.Group>
//              </Col>
//            </Row>
//            <Row className="mb-3">
//              <Col md={6}>
//                <Form.Group controlId="is_admin">
//                  <Form.Label>Admin Privileges</Form.Label>
//                  <Form.Select
//                    name="is_admin"
//                    value={employee.is_admin ? 'true' : 'false'}
//                    onChange={handleChange}
//                  >
//                    <option value="false">No</option>
//                    <option value="true">Yes</option>
//                  </Form.Select>
//                </Form.Group>
//              </Col>
//            </Row>
//          </Form>
//          <div className="text-center mb-4">
//            <Button variant="primary" className="mx-2" onClick={handleSave}>Save Changes</Button>
//            <Button variant="dark" className="mx-2" onClick={() => navigate(-1)}>Back</Button>
//          </div>
//        </Container>
//      );
//    }
   
//    export default EmployeeDetails;
   
