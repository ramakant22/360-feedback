import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; 
import { useFeedback } from '../contexts/FeedbackContext.tsx';
import { User, FeedbackRequest } from '../types';
import ReceivedFeedbackCard from '../components/feedback/ReceivedFeedbackCard.tsx';
import RatingDistributionChart from '../components/reports/RatingDistributionChart.tsx';
import { MagnifyingGlassIcon, UserCircleIcon, UsersIcon, ChartBarIcon, FolderOpenIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const TeamReportsPage: React.FC = () => {
  const { currentUser, users, getUsersInHierarchy, getFeedbackReceivedForUser, initialDataLoaded } = useFeedback();
  const location = useLocation(); 

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [selectedUserFeedback, setSelectedUserFeedback] = useState<FeedbackRequest[]>([]);
  
  const manageableUsers = useMemo(() => {
    if (!currentUser || !initialDataLoaded) return [];
    let MUsers: User[] = [];
    if (currentUser.role === 'super-admin') {
      MUsers = users.filter(u => u.id !== currentUser.id);
    } else if (currentUser.role === 'admin') {
      MUsers = getUsersInHierarchy(currentUser.id);
    }
    return MUsers.sort((a,b) => a.name.localeCompare(b.name));
  }, [currentUser, users, getUsersInHierarchy, initialDataLoaded]);

  useEffect(() => {
    if (initialDataLoaded) { 
      const params = new URLSearchParams(location.search);
      const userIdFromQuery = params.get('userId');
      if (userIdFromQuery) {
        const isUserPotentiallyManageable = currentUser?.role === 'super-admin' ? 
            users.some(u => u.id === userIdFromQuery && u.id !== currentUser.id) :
            manageableUsers.some(u => u.id === userIdFromQuery);

        if (isUserPotentiallyManageable) {
          if (selectedUserId !== userIdFromQuery) { 
            setSelectedUserId(userIdFromQuery);
          }
        } else {
          if (selectedUserId === userIdFromQuery) setSelectedUserId(null); 
        }
      } else if (!selectedUserId && manageableUsers.length > 0 && currentUser?.role !== 'super-admin'){
      }
    }
  }, [location.search, initialDataLoaded, manageableUsers, users, currentUser, selectedUserId]);


  const filteredUsers = useMemo(() => {
    if (!searchTerm) return manageableUsers;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return manageableUsers.filter(user =>
      user.name.toLowerCase().includes(lowerSearchTerm) ||
      user.email.toLowerCase().includes(lowerSearchTerm) ||
      user.hierarchyLevel.toLowerCase().includes(lowerSearchTerm)
    );
  }, [manageableUsers, searchTerm]);

  useEffect(() => {
    const fetchReportData = async () => {
      if (selectedUserId) {
        setIsLoadingReport(true);
        const feedback = getFeedbackReceivedForUser(selectedUserId);
        setSelectedUserFeedback(feedback);
        setIsLoadingReport(false);
      } else {
        setSelectedUserFeedback([]);
      }
    };
    fetchReportData();
  }, [selectedUserId, getFeedbackReceivedForUser]);

  const findReviewerName = (reviewerId: string) => {
    const reviewer = users.find(u => u.id === reviewerId);
    return reviewer ? reviewer.name : 'Unknown Reviewer';
  };

  const aggregateRatings = (feedbackItems: FeedbackRequest[]) => {
    const ratingQuestionsData: { [questionId: string]: { questionText: string, ratings: number[] } } = {};
    feedbackItems.forEach(request => {
      request.questions.forEach(question => {
        if (question.type === 'rating') {
          if (!ratingQuestionsData[question.id]) {
            ratingQuestionsData[question.id] = { questionText: question.text, ratings: [] };
          }
          const response = request.responses?.find(r => r.questionId === question.id);
          if (response?.rating !== undefined) {
            ratingQuestionsData[question.id].ratings.push(response.rating);
          }
        }
      });
    });
    return Object.values(ratingQuestionsData).filter(data => data.ratings.length > 0);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const aggregatedRatingData = selectedUserFeedback ? aggregateRatings(selectedUserFeedback) : [];

  const canViewSelectedUserReport = useMemo(() => {
    if (!currentUser || !selectedUserId || !selectedUser) return false;
    if (currentUser.role === 'super-admin') return selectedUser.id !== currentUser.id; 
    return manageableUsers.some(mUser => mUser.id === selectedUserId);
  }, [currentUser, selectedUserId, selectedUser, manageableUsers]);


  if (!initialDataLoaded) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text="Loading team data..."/></div>;
  }
  
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super-admin')) {
    return (
        <div className="p-6 bg-white rounded-xl shadow-lg text-center m-4">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-700">Access Denied</h1>
            <p className="text-slate-600 mt-2">You do not have permission to view this page. This page is for Admins and Super Admins only.</p>
        </div>
    );
  }


  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3">
                <FolderOpenIcon className="h-8 w-8 text-sky-600" />
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Team Feedback Reports</h1>
                    <p className="text-slate-600">View feedback for members in your team/organization.</p>
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-grow min-h-0">
        <aside className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 bg-white p-4 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-slate-700 mb-3 flex items-center">
            <UsersIcon className="h-6 w-6 mr-2 text-sky-600"/> Select Team Member
          </h2>
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, level..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm shadow-sm"
            />
          </div>
          {filteredUsers.length === 0 ? (
            <p className="text-slate-500 text-sm italic text-center py-4">
              {manageableUsers.length === 0 ? "No users in your manageable hierarchy." : "No users match your search."}
            </p>
          ) : (
            <div className="max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-250px)] overflow-y-auto space-y-2 pr-1">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full flex items-center p-2.5 rounded-lg text-left transition-colors duration-150
                              ${selectedUserId === user.id ? 'bg-sky-100 border-sky-300 ring-1 ring-sky-300' : 'hover:bg-slate-100 border-transparent'} border`}
                  aria-pressed={selectedUserId === user.id}
                >
                  <img src={user.avatarUrl} alt={user.name} className="h-9 w-9 rounded-full mr-3 object-cover"/>
                  <div>
                    <p className={`font-medium text-sm ${selectedUserId === user.id ? 'text-sky-700' : 'text-slate-800'}`}>{user.name}</p>
                    <p className={`text-xs ${selectedUserId === user.id ? 'text-sky-600' : 'text-slate-500'}`}>{user.hierarchyLevel}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="flex-grow bg-white p-4 sm:p-6 rounded-xl shadow-lg overflow-y-auto">
          {isLoadingReport && (
            <div className="flex flex-col items-center justify-center h-full">
              <LoadingSpinner size="lg" text={`Loading reports for ${selectedUser?.name || 'selected user'}...`} />
            </div>
          )}
          {!isLoadingReport && !selectedUserId && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <UserCircleIcon className="h-20 w-20 text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg font-semibold">Select a team member</p>
              <p className="text-slate-500 mt-1">Choose a user from the list to view their feedback reports.</p>
            </div>
          )}
          {!isLoadingReport && selectedUserId && !selectedUser && (
             <div className="flex flex-col items-center justify-center h-full text-center">
              <ChartBarIcon className="h-20 w-20 text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg font-semibold">User Not Found</p>
              <p className="text-slate-500 mt-1">The selected user (ID: {selectedUserId}) could not be found. Please select a valid user from the list.</p>
            </div>
          )}
          {!isLoadingReport && selectedUser && !canViewSelectedUserReport && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-slate-700">Access Denied to Report</h1>
              <p className="text-slate-600 mt-2">You do not have permission to view feedback reports for {selectedUser.name}.</p>
              <p className="text-sm text-slate-500 mt-1">Please select a user from your manageable team or contact an administrator if you believe this is an error.</p>
            </div>
          )}
          {!isLoadingReport && selectedUser && canViewSelectedUserReport && selectedUserFeedback.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ChartBarIcon className="h-20 w-20 text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg font-semibold">No feedback reports for {selectedUser.name}</p>
              <p className="text-slate-500 mt-1">This user has not received any completed feedback yet.</p>
            </div>
          )}
          {!isLoadingReport && selectedUser && canViewSelectedUserReport && selectedUserFeedback.length > 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Feedback Reports for {selectedUser.name}</h2>
                <p className="text-slate-500">{selectedUser.hierarchyLevel} - {selectedUser.email}</p>
              </div>

              {aggregatedRatingData.length > 0 && (
                <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Overall Rating Summaries</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {aggregatedRatingData.map(data => (
                      <div key={data.questionText} className="p-3 border rounded-md bg-white shadow-sm">
                        <h4 className="text-sm font-medium text-slate-600 mb-1.5">{data.questionText}</h4>
                        <RatingDistributionChart ratings={data.ratings} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-700 mb-0">Individual Feedback Details</h3>
                {selectedUserFeedback.map(request => (
                  <ReceivedFeedbackCard 
                    key={request.id} 
                    request={request} 
                    reviewerName={request.isAnonymous ? 'Anonymous Reviewer' : findReviewerName(request.reviewerId)}
                  />
                ))}
              </section>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeamReportsPage;