import React, { useState, useMemo } from 'react';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import { FeedbackRequest } from '../../types';
import { TableCellsIcon, MagnifyingGlassIcon, CheckCircleIcon, ClockIcon, XCircleIcon, UserCircleIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

type SortConfig = {
  key: keyof FeedbackRequest | 'subjectUserName' | 'reviewerUserName' | 'cycleName';
  direction: 'ascending' | 'descending';
} | null;

const AllRequestsView: React.FC = () => {
  const { getAllFeedbackRequests, users, getCycleById, currentUser } = useFeedback();
  const navigate = useNavigate();
  const allRequests = getAllFeedbackRequests();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FeedbackRequest['status']>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown User';

  const enrichedRequests = useMemo(() => {
    return allRequests.map(req => ({
      ...req,
      subjectUserName: getUserName(req.subjectUserId),
      reviewerUserName: getUserName(req.reviewerId),
      cycleName: req.cycleId ? getCycleById(req.cycleId)?.name : 'N/A',
    }));
  }, [allRequests, users, getCycleById]);

  const filteredRequests = useMemo(() => {
    let Freq = enrichedRequests;
    if (statusFilter !== 'all') {
      Freq = Freq.filter(req => req.status === statusFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      Freq = Freq.filter(req =>
        req.subjectUserName.toLowerCase().includes(lowerSearchTerm) ||
        req.reviewerUserName.toLowerCase().includes(lowerSearchTerm) ||
        req.id.toLowerCase().includes(lowerSearchTerm) ||
        (req.cycleName && req.cycleName.toLowerCase().includes(lowerSearchTerm))
      );
    }
    return Freq;
  }, [enrichedRequests, searchTerm, statusFilter]);

  const sortedRequests = useMemo(() => {
    let sortableItems = [...filteredRequests];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key as keyof typeof a] !== undefined ? a[sortConfig.key as keyof typeof a] : '';
        const valB = b[sortConfig.key as keyof typeof b] !== undefined ? b[sortConfig.key as keyof typeof b] : '';
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRequests, sortConfig]);

  const requestSort = (key: NonNullable<SortConfig>['key']) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: NonNullable<SortConfig>['key']) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  const getStatusBadgeElement = (status: FeedbackRequest['status']) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><ClockIcon className="h-3 w-3 mr-1"/>Pending</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon className="h-3 w-3 mr-1"/>Completed</span>;
      case 'declined':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="h-3 w-3 mr-1"/>Declined</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Unknown</span>;
    }
  };


  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-700 flex items-center"><TableCellsIcon className="h-6 w-6 mr-2 text-sky-600" />All Feedback Requests</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            placeholder="Search by user, ID, cycle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm shadow-sm"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="block w-full py-2 px-3 border border-slate-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {sortedRequests.length === 0 ? (
         <div className="text-center py-10">
            <MagnifyingGlassIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No feedback requests match your criteria.</p>
            <p className="text-sm text-slate-400">Try adjusting your search or filters.</p>
        </div>
      ) : (
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              {['Subject', 'Reviewer', 'Status', 'Cycle', 'Requested', 'Completed'].map((header, idx) => {
                const keys: (NonNullable<SortConfig>['key'])[] = ['subjectUserName', 'reviewerUserName', 'status', 'cycleName', 'dateRequested', 'dateCompleted'];
                const key = keys[idx];
                return (
                  <th key={header} scope="col" onClick={() => requestSort(key)}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                    {header} {getSortIndicator(key)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedRequests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                  <div className="flex items-center">
                    <UserCircleIcon className="h-5 w-5 text-slate-400 mr-1.5"/>
                    {req.subjectUserName}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                   <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-slate-400 mr-1.5"/>
                    {req.reviewerUserName} {req.isAnonymous && <span className="ml-1 text-xs text-sky-600">(Anon)</span>}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {req.status === 'completed' && (currentUser?.role === 'admin' || currentUser?.role === 'super-admin') ? (
                    <button
                      onClick={() => navigate(`/report/${req.id}`)} 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                      title={`View Report ID: ${req.id}`}
                      aria-label={`View report for request ${req.id}`}
                    >
                      <CheckCircleIcon className="h-3 w-3 mr-1"/>Completed
                    </button>
                  ) : (
                    getStatusBadgeElement(req.status)
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{req.cycleName}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{new Date(req.dateRequested).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{req.dateCompleted ? new Date(req.dateCompleted).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      <p className="text-sm text-slate-600 mt-2">Total Requests: {sortedRequests.length}</p>
    </div>
  );
};

export default AllRequestsView;