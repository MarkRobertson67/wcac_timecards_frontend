
import React from 'react';


function CreateNewTimeCard({ setIsNewTimeCardCreated }) {
  const handleCreateTimeCard = () => {
    // Put your logic to create a new time card
    setIsNewTimeCardCreated(true);
  };

  return (
    <div>
      <h2>Create New Time Card</h2>
      <button onClick={handleCreateTimeCard}>Create</button>
    </div>
  );
}

export default CreateNewTimeCard;

