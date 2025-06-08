import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline'; // Removed Bars3Icon as it's not used
import { UserRole } from '../../types'; 

interface TopBarProps {
  // setSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>; 
}

const TopBar: React.FC<TopBarProps> = () => {
  const { currentUser, logout } = useFeedback();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'super-admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'provider': return 'Provider';
      default: return role;
    }
  };

  return (
    <header className="bg-white shadow-md h-16 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-bold text-sky-600 hover:text-sky-500 transition-colors">
          FeedbackPortal
        </Link>
      </div>
      {currentUser && (
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 hidden sm:block">
            Welcome, <span className="font-semibold">{currentUser.name}</span> 
            <span className="text-xs text-sky-600 ml-1">({getRoleDisplayName(currentUser.role)})</span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-slate-600 hover:text-sky-600 p-2 rounded-md hover:bg-sky-50 transition-colors"
            title="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            <span className="text-sm font-medium hidden md:block">Logout</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default TopBar;