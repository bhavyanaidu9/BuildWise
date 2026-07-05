import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page and keep the current URL in location state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize allowed roles list
  const roles = allowedRoles 
    ? allowedRoles 
    : allowedRole 
      ? [allowedRole] 
      : [];

  const hasAccess = roles.length === 0 || roles.includes(user.role);

  if (!hasAccess) {
    // Redirect unauthorized users to their respective dashboards
    if (user.role === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    } else if (user.role === 'builder') {
      return <Navigate to="/dashboard/builder" replace />;
    } else {
      return <Navigate to="/dashboard/customer" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
