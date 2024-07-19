// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportType, reportData } = location.state || {};

  useEffect(() => {
    console.log('Report Type:', reportType);
    console.log('Report Data:', reportData);
  }, [reportType, reportData]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!reportData) {
      console.error('No report data available to export');
      return;
    }

    const csv = reportData.map(row =>
      `${row.employee_id},${row.first_name},${row.last_name},${row.total_hours}`
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">{reportType} Report</h2>
      {reportData && reportData.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Total Hours</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map(row => (
              <tr key={row.employee_id}>
                <td>{row.employee_id}</td>
                <td>{row.first_name}</td>
                <td>{row.last_name}</td>
                <td>{row.total_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No report data available</p>
      )}
      <div className="text-center mt-4">
        <button className="btn btn-secondary mx-2" onClick={handlePrint}>Print</button>
        <button className="btn btn-primary mx-2" onClick={handleExportCsv}>Export CSV</button>
        <button className="btn btn-secondary mx-2" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
}

export default ReportPage;



