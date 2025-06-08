import React, { useState } from 'react';
import { useFeedback } from '../contexts/FeedbackContext.tsx';
import FeedbackRequestList from '../components/feedback/FeedbackRequestList';
import RequestFeedbackModal from '../components/modals/RequestFeedbackModal';
import { PlusCircleIcon, InboxArrowDownIcon, ForwardIcon } from '@heroicons/react/24/outline';
import { UserRole } from '../types';

const DashboardPage: React.FC = () => {
  const { currentUser, getFeedbackForCurrentUserToGive, getFeedbackRequestsSentByCurrentUser } = useFeedback();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  if (!currentUser) return null; 
  
  const feedbackToGive = getFeedbackForCurrentUserToGive();
  const feedbackAboutCurrentUser = getFeedbackRequestsSentByCurrentUser();

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'super-admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'provider': return 'Provider';
      default: return role;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, {currentUser.name}! Here's your feedback overview.
            {(currentUser.role === 'admin' || currentUser.role === 'super-admin') && 
              <span className="ml-2 text-xs font-semibold text-sky-600 py-0.5 px-1.5 bg-sky-100 rounded-full">
                {getRoleDisplayName(currentUser.role)} Access
              </span>
            }
          </p>
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-700 text-black font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-colors duration-150 flex items-center space-x-2 w-full sm:w-auto"
          aria-label="Request Feedback"
        >
          <PlusCircleIcon className="h-5 w-5" />
          <span>Request Feedback</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section aria-labelledby="feedback-to-provide-heading" className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <InboxArrowDownIcon className="h-7 w-7 text-sky-600" />
            <h2 id="feedback-to-provide-heading" className="text-xl font-semibold text-slate-700">
              Feedback You Need to Provide 
              <span className={`ml-2 text-sm font-bold ${feedbackToGive.length > 0 ? 'text-sky-600' : 'text-slate-500'}`}>
                ({feedbackToGive.length})
              </span>
            </h2>
          </div>
          {feedbackToGive.length > 0 ? (
            <FeedbackRequestList requests={feedbackToGive} type="toGive" />
          ) : (
            <p className="text-slate-500 italic text-center py-4">No pending feedback requests for you to complete. Great job!</p>
          )}
        </section>

        <section aria-labelledby="feedback-about-you-heading" className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <ForwardIcon className="h-7 w-7 text-purple-600" />
            <h2 id="feedback-about-you-heading" className="text-xl font-semibold text-slate-700">
              Feedback Requested About You
              <span className={`ml-2 text-sm font-bold ${feedbackAboutCurrentUser.length > 0 ? 'text-purple-600' : 'text-slate-500'}`}>
                ({feedbackAboutCurrentUser.length})
              </span>
            </h2>
          </div>
          {feedbackAboutCurrentUser.length > 0 ? (
            <FeedbackRequestList requests={feedbackAboutCurrentUser} type="sent" />
          ) : (
            <p className="text-slate-500 italic text-center py-4">No feedback has been requested about you yet.</p>
          )}
        </section>
      </div>
      
      {isRequestModalOpen && (
        <RequestFeedbackModal 
          isOpen={isRequestModalOpen} 
          onClose={() => setIsRequestModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default DashboardPage;