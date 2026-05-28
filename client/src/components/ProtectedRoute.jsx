import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to login if token is missing
    return <Navigate to="/login" replace />;
  }

  return children;
}
