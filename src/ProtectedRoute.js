// Proprietary Software License
// Copyright (c) 2024 Mark Robertson
// See LICENSE.txt file for details.


import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../src/firebase/firebaseConfig';

const ProtectedRoute = ({ children }) => {
  const user = auth.currentUser; // Check if a user is logged in

  if (!user) {
    return <Navigate to="/" replace />; // Redirect to home page if not authenticated
  }

  return children; // Render the children if authenticated
};

export default ProtectedRoute;
