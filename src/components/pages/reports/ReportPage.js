// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function ReportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportType, reportData } = location.state || {};

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    // Implement CSV export logic here
  };

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  // Function to format the report data
  const formatReportData = (data) => {
    if (Array.isArray(data)) {
      return data.map((item, index) => (
        <div key={index}>
          <p>Employee ID: {item.employee_id}</p>
          <p>Name: {item.first_name} {item.last_name}</p>
          <p>Total Hours: {item.total_hours}</p>
        </div>
      ));
    } else if (typeof data === 'object') {
      return (
        <div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
    } else {
      return <p>No data available</p>;
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">{reportType ? reportType.replace(/([A-Z])/g, ' $1').toUpperCase() : "Your Report Didn't Generate"}</h2>
      <div className="mb-4">
        {formatReportData(reportData)}
        {/* Display the report data */}
      </div>
      <div className="text-center">
        <button className="btn btn-success mx-2" onClick={handleExportCsv}>Export to CSV</button>
        <button className="btn btn-primary mx-2" onClick={handlePrint}>Print Report</button>
        <button className="btn btn-danger mx-2" onClick={handleBack}>Back</button>
      </div>
    </div>
  );
}

export default ReportPage;

