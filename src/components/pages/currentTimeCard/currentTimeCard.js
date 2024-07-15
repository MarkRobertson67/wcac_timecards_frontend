import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button } from 'react-bootstrap';

function CurrentTimeCard({ setIsNewTimeCardCreated }) {
  const [timeCard, setTimeCard] = useState({ entries: [], isSubmitted: false });
  const [tempEntries, setTempEntries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const startDate = localStorage.getItem('startDate');
    if (startDate) {
      const start = new Date(startDate);
      const endDate = new Date(start);
      endDate.setDate(endDate.getDate() + 13);

      const initialEntries = [];
      let currentDate = new Date(start);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        // Include only weekdays (Monday to Friday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
          initialEntries.push({
            date: currentDate.toISOString().slice(0, 10),
            startTime: '',
            lunchStart: '',
            lunchEnd: '',
            endTime: ''
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setTimeCard({ entries: initialEntries, isSubmitted: false });
      setTempEntries(initialEntries.map(entry => ({ ...entry })));
    }
  }, []);

  const handleChange = (index, field, value) => {
    const updatedTempEntries = [...tempEntries];
    updatedTempEntries[index][field] = value;
    setTempEntries(updatedTempEntries);
  };

  const handleSave = (index) => {
    const updatedEntries = tempEntries.map((entry, i) =>
      i === index ? { ...entry } : timeCard.entries[i]
    );

    const updatedTimeCard = { ...timeCard, entries: updatedEntries };
    console.log('Saving updated time card:', updatedTimeCard);

    setTimeCard(updatedTimeCard);
  };

  const handleSubmit = () => {
    setTimeCard({ entries: [], isSubmitted: true });
    setIsNewTimeCardCreated(false);
    navigate('/');
  };

  const handleReset = () => {
    setTimeCard({ entries: [], isSubmitted: false });
    setIsNewTimeCardCreated(false);
    navigate('/createNewTimeCard');
  };

  return (
    <Container className="mt-4">
      <div className="current-time-card">
        <h2 className="mb-4 text-center">Current Time Card</h2>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Date</th>
              <th>Start Time</th>
              <th>Lunch Start</th>
              <th>Lunch End</th>
              <th>End Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {timeCard.entries.map((entry, index) => (
              <tr key={index}>
                <td>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                <td><input type="time" value={tempEntries[index]?.startTime || ''} onChange={(e) => handleChange(index, 'startTime', e.target.value)} disabled={timeCard.isSubmitted} /></td>
                <td><input type="time" value={tempEntries[index]?.lunchStart || ''} onChange={(e) => handleChange(index, 'lunchStart', e.target.value)} disabled={timeCard.isSubmitted} /></td>
                <td><input type="time" value={tempEntries[index]?.lunchEnd || ''} onChange={(e) => handleChange(index, 'lunchEnd', e.target.value)} disabled={timeCard.isSubmitted} /></td>
                <td><input type="time" value={tempEntries[index]?.endTime || ''} onChange={(e) => handleChange(index, 'endTime', e.target.value)} disabled={timeCard.isSubmitted} /></td>
                <td>
                  {!timeCard.isSubmitted &&
                    <Button variant="success" className="mr-2" onClick={() => handleSave(index)}>Save</Button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div className="text-center">
          {!timeCard.isSubmitted &&
            <>
              <Button variant="primary" className="mr-2" onClick={handleSubmit}>Submit Time Card</Button>
              <Button variant="secondary" onClick={handleReset}>Reset Time Card</Button>
            </>
          }
        </div>
      </div>
      <div style={{ marginBottom: '80px' }}></div> {/* Space to prevent content from being hidden under the footer */}
    </Container>
  );
}

export default CurrentTimeCard;



















