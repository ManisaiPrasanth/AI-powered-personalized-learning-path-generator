import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { Layout } from './Layout';

/** Student app shell — admins are redirected to the admin portal. */
export const StudentShell: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Layout />;
};
