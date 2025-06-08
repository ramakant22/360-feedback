import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useFeedback } from '../../contexts/FeedbackContext.tsx'; // Corrected import
import LoadingSpinner from '../shared/LoadingSpinner.tsx'; // Corrected import
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, currentUser, initialDataLoaded } = useFeedback();
  const location = useLocation();

  if (!initialDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && currentUser && currentUser.role !== 'admin' && currentUser.role !== 'super-admin') {
    toast.error("Access Denied: Admin privileges required.");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;