import React, { useState } from 'react';
import { FeedbackRequest } from '../../types';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import ProvideFeedbackModal from '../modals/ProvideFeedbackModal';
import { PencilSquareIcon, CheckCircleIcon, ClockIcon, CalendarDaysIcon, UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline';

interface FeedbackRequestListProps {
  requests: FeedbackRequest[];
  type: 'toGive' | 'sent';
}

const FeedbackRequestList: React.FC<FeedbackRequestListProps> = ({ requests, type }) => {
  const { users, getCycleById, isCycleActive } = useFeedback();
  const [selectedRequest, setSelectedRequest] = useState<FeedbackRequest | null>(null);
  const [isProvideModalOpen, setIsProvideModalOpen] = useState(false);

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };
  
  const getUserAvatar = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.avatarUrl : 'https://via.placeholder.com/40';
  }


  const handleProvideFeedbackClick = (request: FeedbackRequest) => {
    setSelectedRequest(request);
    setIsProvideModalOpen(true);
  };
  
  const getStatusInfo = (status: FeedbackRequest['status']) => {
    switch (status) {
      case 'pending':
        return { icon: ClockIcon, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' };
      case 'completed':
        return { icon: CheckCircleIcon, color: 'text-green-600 bg-green-100', label: 'Completed' };
      default:
        return { icon: ClockIcon, color: 'text-slate-500 bg-slate-100', label: 'Unknown' };
    }
  };

  return (
    <div className="space-y-4">
      {requests.map(request => {
        const cycle = request.cycleId ? getCycleById(request.cycleId) : undefined;
        const cycleIsCurrentlyActive = cycle ? isCycleActive(cycle) : false;
        const StatusIcon = getStatusInfo(request.status).icon;
        const statusColor = getStatusInfo(request.status).color;
        const statusLabel = getStatusInfo(request.status).label;

        const targetUserIsSubject = type === 'toGive';
        const targetUserId = targetUserIsSubject ? request.subjectUserId : request.reviewerId;
        const targetUserName = getUserName(targetUserId);
        const targetUserAvatar = getUserAvatar(targetUserId);
        
        let titlePrefix = '';
        // let iconForTitle: React.ElementType = UserCircleIcon; // Not used

        if (type === 'toGive') {
            titlePrefix = `For: `;
            // iconForTitle = UserCircleIcon;
        } else { 
            titlePrefix = request.isAnonymous ? `From: ` : `From: `;
            // iconForTitle = request.isAnonymous ? UsersIcon : UserCircleIcon;
        }
        const displayName = type === 'sent' && request.isAnonymous ? 'Anonymous Reviewer' : targetUserName;


        return (
          <div key={request.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-150 ease-in-out">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
              <div className="flex-grow mb-3 sm:mb-0">
                <div className="flex items-center mb-1">
                   <img src={targetUserAvatar} alt={displayName} className="h-8 w-8 rounded-full mr-2 object-cover" />
                  <p className="text-md font-semibold text-slate-700">
                    {titlePrefix}
                    <span className={request.isAnonymous && type === 'sent' ? 'italic' : ''}>{displayName}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-500 ml-10">
                  Requested: {new Date(request.dateRequested).toLocaleDateString()}
                  {request.isAnonymous && type === 'sent' && (
                     <span className="ml-2 px-1.5 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full">Anonymous</span>
                  )}
                </p>
                {cycle && (
                  <div className={`mt-1.5 ml-10 text-xs flex items-center space-x-1 py-0.5 px-1.5 rounded-md w-fit
                    ${cycleIsCurrentlyActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    <span>{cycle.name} ({cycleIsCurrentlyActive ? "Active" : "Inactive"})</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end space-y-2 flex-shrink-0 self-start sm:self-center">
                 <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${statusColor}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {statusLabel}
                </span>
                {type === 'toGive' && request.status === 'pending' && (
                  <button
                    onClick={() => handleProvideFeedbackClick(request)}
                    className="bg-green-500 hover:bg-green-600 text-black font-semibold py-1.5 px-3.5 rounded-md text-sm flex items-center space-x-1.5 transition-colors w-full sm:w-auto justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={cycle && !cycleIsCurrentlyActive}
                    title={cycle && !cycleIsCurrentlyActive ? `Cycle "${cycle.name}" is not active for submissions.` : "Provide Feedback"}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                    <span>Provide Feedback</span>
                  </button>
                )}
                 {type === 'sent' && request.status === 'completed' && (
                  <span className="text-xs text-green-600 italic mt-1">Feedback Submitted</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {selectedRequest && isProvideModalOpen && (
        <ProvideFeedbackModal
          isOpen={isProvideModalOpen}
          onClose={() => {
            setIsProvideModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          subjectName={getUserName(selectedRequest.subjectUserId)}
        />
      )}
    </div>
  );
};

export default FeedbackRequestList;