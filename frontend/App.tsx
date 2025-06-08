import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { FeedbackProvider, useFeedback } from './contexts/FeedbackContext.tsx';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import DashboardPage from './pages/DashboardPage';
import MyReportsPage from './pages/MyReportsPage';
import TeamReportsPage from './pages/TeamReportsPage'; 
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import IndividualReportPage from './pages/IndividualReportPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import LoadingSpinner from './components/shared/LoadingSpinner'; 
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'; 

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useFeedback();
   // Only show sidebar and topbar if a user is logged in.
  if (!currentUser) {
    return <>{children}</>; // LoginPage will be rendered here without layout
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  // Use initialDataLoaded (which is !initialDataLoading) and initialDataError
  const { initialDataLoaded, initialDataError, isLoading } = useFeedback();

  // isLoading now refers to general operation loading, not initial load specifically
  // initialDataLoaded being false implies initialDataLoading is true
  if (!initialDataLoaded && !initialDataError) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
        <LoadingSpinner size="lg" text="Loading application data from server..." />
      </div>
    );
  }

  if (initialDataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-700 p-4">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error Loading Application</h1>
        <p className="text-center mb-4">{initialDataError}</p>
        <p className="text-sm">Please ensure the backend server is running and try refreshing the page. Contact support if the issue persists.</p>
      </div>
    );
  }
  
  if (!initialDataLoaded) { 
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
        <LoadingSpinner size="lg" text="Initializing..." />
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-reports" 
          element={
            <ProtectedRoute>
              <MyReportsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/team-reports" 
          element={
            <ProtectedRoute adminOnly={true}>
              <TeamReportsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/report/:requestId" 
          element={
            <ProtectedRoute adminOnly={true}>
              <IndividualReportPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};


const App: React.FC = () => {
  return (
    <FeedbackProvider>
      <AppContent />
      <Toaster position="top-right" reverseOrder={false} toastOptions={{
        style: {
          borderRadius: '8px',
          background: '#333',
          color: '#fff',
        },
      }}/>
    </FeedbackProvider>
  );
};

export default App;