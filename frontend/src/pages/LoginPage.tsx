import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFeedback } from '../contexts/FeedbackContext.tsx';
import { User } from '../types';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { users, login, isAuthenticated, currentUser, initialDataLoaded } = useFeedback();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (initialDataLoaded && isAuthenticated && currentUser) {
      navigate(from, { replace: true });
    }
  }, [initialDataLoaded, isAuthenticated, currentUser, navigate, from]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error('Please select a user to log in.');
      return;
    }
    login(selectedUserId);
  };

  if (!initialDataLoaded || (isAuthenticated && currentUser)) {
    return null; 
  }
  
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-500 to-indigo-600 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <UserCircleIcon className="w-16 h-16 text-sky-500 mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-slate-800">Welcome Back!</h1>
            <p className="text-slate-600 mt-1">Select your profile to continue.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="userSelect" className="block text-sm font-medium text-slate-700 sr-only">
                Select User
              </label>
              <div className="relative">
                <select
                  id="userSelect"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-3 pr-10 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-700 text-base appearance-none"
                  required
                >
                  <option value="" disabled>-- Select Your Profile --</option>
                  {sortedUsers.map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.hierarchyLevel})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                   <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-black font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-150 ease-in-out flex items-center justify-center space-x-2"
              disabled={!selectedUserId}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Login</span>
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-sky-100 mt-6">
          This is a mock login for demonstration purposes.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;