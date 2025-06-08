import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFeedback } from '../contexts/FeedbackContext.tsx';
import ReceivedFeedbackCard from '../components/feedback/ReceivedFeedbackCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { ArrowLeftIcon, DocumentMagnifyingGlassIcon, ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const IndividualReportPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { getFeedbackRequestById, users, initialDataLoaded, currentUser, getUsersInHierarchy } = useFeedback();

  if (!initialDataLoaded || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" text="Loading report data..." />
      </div>
    );
  }
  
  if (currentUser.role !== 'admin' && currentUser.role !== 'super-admin') {
     return (
        <div className="p-6 bg-white rounded-xl shadow-lg text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-700">Access Denied</h1>
            <p className="text-slate-600 mt-2">You do not have permission to view this page.</p>
            <Link 
                to="/admin" 
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Return to Admin Panel
            </Link>
        </div>
    );
  }

  if (!requestId) {
    return <p className="text-red-500 p-4">Error: Report ID is missing.</p>;
  }

  const feedbackRequest = getFeedbackRequestById(requestId);

  if (!feedbackRequest) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg text-center">
        <DocumentMagnifyingGlassIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-700">Report Not Found</h1>
        <p className="text-slate-600 mt-2">The requested feedback report (ID: {requestId}) could not be found.</p>
        <Link 
            to="/admin" 
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Return to Admin Panel
        </Link>
      </div>
    );
  }

  let canViewThisSpecificReport = false;
  const subjectOfFeedbackId = feedbackRequest.subjectUserId;

  if (currentUser.role === 'super-admin') {
    canViewThisSpecificReport = true;
  } else if (currentUser.role === 'admin') {
    if (subjectOfFeedbackId === currentUser.id) { 
      canViewThisSpecificReport = true;
    } else {
      const managedUsers = getUsersInHierarchy(currentUser.id);
      if (managedUsers.some(mu => mu.id === subjectOfFeedbackId)) { 
        canViewThisSpecificReport = true;
      }
    }
  }

  if (!canViewThisSpecificReport) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg text-center">
        <LockClosedIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-700">Access Denied to this Report</h1>
        <p className="text-slate-600 mt-2">You do not have the necessary permissions to view the details of this specific feedback report.</p>
        <p className="text-sm text-slate-500 mt-1">This may be because the subject of the report is not within your management hierarchy.</p>
        <Link 
            to="/admin" 
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-black bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Return to Admin Panel
        </Link>
      </div>
    );
  }

  const subjectUser = users.find(u => u.id === feedbackRequest.subjectUserId);
  const reviewerName = feedbackRequest.isAnonymous ? 'Anonymous Reviewer' : users.find(u => u.id === feedbackRequest.reviewerId)?.name || 'Unknown Reviewer';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-slate-800">Feedback Report Details</h1>
            <p className="text-slate-600">
                Displaying feedback for: <span className="font-semibold">{subjectUser?.name || 'Unknown User'}</span>
            </p>
        </div>
        <Link 
            to="/admin" 
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
        >
            <ArrowLeftIcon className="h-5 w-5 mr-2 text-slate-500" />
            Back to Admin Panel
        </Link>
      </div>

      <ReceivedFeedbackCard request={feedbackRequest} reviewerName={reviewerName} />
      
      <div className="bg-white p-4 rounded-xl shadow-md mt-4">
        <h3 className="text-md font-semibold text-slate-700 mb-2">Request Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="sm:col-span-1">
            <dt className="text-slate-500">Subject:</dt>
            <dd className="text-slate-800 font-medium">{subjectUser?.name || 'N/A'} ({subjectUser?.hierarchyLevel || 'N/A'})</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-slate-500">Reviewer:</dt>
            <dd className="text-slate-800 font-medium">{reviewerName}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-slate-500">Date Requested:</dt>
            <dd className="text-slate-800">{new Date(feedbackRequest.dateRequested).toLocaleString()}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-slate-500">Date Completed:</dt>
            <dd className="text-slate-800">{feedbackRequest.dateCompleted ? new Date(feedbackRequest.dateCompleted).toLocaleString() : 'N/A'}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-slate-500">Status:</dt>
            <dd className="text-slate-800 capitalize">{feedbackRequest.status}</dd>
          </div>
           <div className="sm:col-span-1">
            <dt className="text-slate-500">Anonymity:</dt>
            <dd className="text-slate-800">{feedbackRequest.isAnonymous ? 'Anonymous' : 'Not Anonymous'}</dd>
          </div>
           {feedbackRequest.cycleId && (
            <div className="sm:col-span-1">
                <dt className="text-slate-500">Feedback Cycle:</dt>
                <dd className="text-slate-800">{useFeedback().getCycleById(feedbackRequest.cycleId)?.name || 'N/A'}</dd>
            </div>
           )}
        </dl>
      </div>
    </div>
  );
};

export default IndividualReportPage;