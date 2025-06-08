import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../shared/Modal';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import { User, FeedbackCycle, QuestionTemplate } from '../../types';
import toast from 'react-hot-toast';
import { UserPlusIcon, ShieldCheckIcon, ShieldExclamationIcon, CalendarDaysIcon, CheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface RequestFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestFeedbackModal: React.FC<RequestFeedbackModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, createFeedbackRequest, feedbackCycles, getActiveCycles, isCycleActive, getCycleById, questionTemplates, getTemplateById, getUsersInHierarchy } = useFeedback();
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedReviewerIds, setSelectedReviewerIds] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const subjectOptions = useMemo(() => {
    if (!currentUser || !users.length) return [];
    let options: User[] = [];
    if (currentUser.role === 'super-admin') {
      options = [...users];
    } else if (currentUser.role === 'admin') {
      const managedUsers = getUsersInHierarchy(currentUser.id);
      options = [currentUser, ...managedUsers];
    } else { 
      options = [currentUser];
    }
    const uniqueOptions = Array.from(new Set(options.map(u => u.id))).map(id => users.find(u => u.id === id)!);
    return uniqueOptions.sort((a,b) => a.name.localeCompare(b.name));
  }, [currentUser, users, getUsersInHierarchy]);


  useEffect(() => {
    if (isOpen && currentUser) {
      if (currentUser.role === 'provider') {
        setSelectedSubjectId(currentUser.id);
      } else if (currentUser.role === 'admin' && !selectedSubjectId) {
         setSelectedSubjectId('');
      } else if (currentUser.role === 'super-admin' && !selectedSubjectId) {
         setSelectedSubjectId('');
      }
      
      setSelectedReviewerIds([]);
      setIsAnonymous(true);
      
      const activeCycles = getActiveCycles();
      if (activeCycles.length > 0) {
        const sortedActiveCycles = [...activeCycles].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setSelectedCycleId(sortedActiveCycles[0].id); 
      } else if (feedbackCycles.length > 0) {
        const sortedCycles = [...feedbackCycles].sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
        setSelectedCycleId(sortedCycles[0]?.id || '');
      } else {
        setSelectedCycleId('');
      }

      if (questionTemplates.length > 0) {
        if(!selectedTemplateId || !questionTemplates.find(qt => qt.id === selectedTemplateId)) {
             setSelectedTemplateId(questionTemplates[0].id);
        }
      } else {
        setSelectedTemplateId('');
      }

    }
  }, [isOpen, currentUser, getActiveCycles, feedbackCycles, questionTemplates, subjectOptions, selectedSubjectId, selectedTemplateId]); // Added selectedSubjectId, selectedTemplateId to deps

  if (!currentUser) return null;

  const availableReviewers = users.filter(user => 
    user.id !== selectedSubjectId 
  );
  
  const subjectUser = users.find(u => u.id === selectedSubjectId);
  
  let modalTitle = 'Request Feedback';
  if (currentUser.role === 'super-admin') modalTitle = 'Request Feedback (Super Admin)';
  else if (currentUser.role === 'admin') modalTitle = 'Request Feedback (Admin)';
  else if (subjectUser) modalTitle = `Request Feedback for ${subjectUser.name}`;


  const handleReviewerToggle = (reviewerId: string) => {
    setSelectedReviewerIds(prev =>
      prev.includes(reviewerId)
        ? prev.filter(id => id !== reviewerId)
        : [...prev, reviewerId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      toast.error('Please select a subject for the feedback.');
      return;
    }
    if (selectedReviewerIds.length === 0) {
      toast.error('Please select at least one reviewer.');
      return;
    }
    
    const cycle = selectedCycleId ? getCycleById(selectedCycleId) : null;
    if (!cycle) {
        toast.error('Please select a valid feedback cycle.');
        return;
    }

    const template = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
    if (!template || !template.questions || template.questions.length === 0) {
        toast.error('Please select a valid question template with questions.');
        return;
    }

    createFeedbackRequest(selectedSubjectId, selectedReviewerIds, isAnonymous, selectedCycleId, template.questions, selectedTemplateId);
    onClose();
  };

  const allCyclesSorted = [...feedbackCycles].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const allTemplatesSorted = [...questionTemplates].sort((a,b) => a.name.localeCompare(b.name));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {currentUser.role !== 'provider' ? (
          <div>
            <label htmlFor="subjectUser" className="block text-sm font-medium text-slate-700 mb-1">
              Feedback For (Subject):
            </label>
            <select
              id="subjectUser"
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedReviewerIds([]); 
              }}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2.5 bg-white"
              required
            >
              <option value="" disabled>Select User...</option>
              {subjectOptions.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.hierarchyLevel})</option>
              ))}
            </select>
          </div>
        ) : subjectUser && ( 
             <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-700">Requesting Feedback For:</p>
                <p className="text-slate-800 text-base">{subjectUser.name} (Yourself)</p>
            </div>
        )}

        <div>
          <label htmlFor="feedbackTemplate" className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-1.5 text-slate-500"/> Question Template:
          </label>
          <select
            id="feedbackTemplate"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2.5 bg-white"
            required
            disabled={allTemplatesSorted.length === 0}
          >
            <option value="" disabled>Select Template...</option>
            {allTemplatesSorted.map(template => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          {selectedTemplateId && getTemplateById(selectedTemplateId)?.description && (
            <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 p-1.5 rounded-md">
              {getTemplateById(selectedTemplateId)?.description}
            </p>
          )}
          {!selectedTemplateId && allTemplatesSorted.length > 0 && (
            <p className="text-xs text-red-500 mt-1">Please select a question template.</p>
          )}
           {allTemplatesSorted.length === 0 && (
            <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded-md">No question templates available. An admin should create some templates first.</p>
          )}
        </div>

        <div>
          <label htmlFor="feedbackCycle" className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-1.5 text-slate-500"/> Feedback Cycle:
          </label>
          <select
            id="feedbackCycle"
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2.5 bg-white"
            required
            disabled={allCyclesSorted.length === 0}
          >
            <option value="" disabled>Select Cycle...</option>
            {allCyclesSorted.map(cycle => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name} {isCycleActive(cycle) ? '(Active)' : `(${new Date(cycle.startDate+"T00:00:00Z").toLocaleDateString()} - ${new Date(cycle.endDate+"T00:00:00Z").toLocaleDateString()})`}
              </option>
            ))}
          </select>
          {!selectedCycleId && allCyclesSorted.length > 0 && (
            <p className="text-xs text-red-500 mt-1">Please select a cycle for this feedback request.</p>
          )}
           {allCyclesSorted.length === 0 && (
            <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded-md">No feedback cycles available. An admin needs to create one first.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Reviewers:</label>
          {!selectedSubjectId && (currentUser.role === 'admin' || currentUser.role === 'super-admin') && <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-md">Please select a subject user first to see available reviewers.</p>}
          {selectedSubjectId && availableReviewers.length > 0 ? (
            <div className="max-h-52 overflow-y-auto border border-slate-300 rounded-md p-2 space-y-1 bg-white">
              {availableReviewers.map(reviewer => {
                const isSelected = selectedReviewerIds.includes(reviewer.id);
                return (
                <div 
                  key={reviewer.id} 
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors
                              ${isSelected ? 'bg-sky-50 border border-sky-300 ring-1 ring-sky-300' : 'hover:bg-slate-100'}`}
                  onClick={() => handleReviewerToggle(reviewer.id)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleReviewerToggle(reviewer.id);}}
                >
                  <div className="flex items-center">
                     <img src={reviewer.avatarUrl} alt={reviewer.name} className="h-8 w-8 rounded-full mr-3 object-cover" />
                    <span className="text-slate-800 text-sm">{reviewer.name}</span>
                  </div>
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all
                                  ${isSelected ? 'bg-sky-600 border-sky-600' : 'border-slate-400 bg-slate-50'}`}>
                    {isSelected && <CheckIcon className="h-3.5 w-3.5 text-black" />}
                  </div>
                </div>
                );
              })}
            </div>
          ) : selectedSubjectId && (
            <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-md">No other users available to select as reviewers for {subjectUser?.name || 'the selected subject'}.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Feedback Anonymity:</label>
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
             <div className="flex items-center">
                {isAnonymous ? <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" /> : <ShieldExclamationIcon className="h-5 w-5 text-amber-600 mr-2" />}
                <span className={`text-sm font-medium ${isAnonymous ? 'text-green-700' : 'text-amber-700'}`}>
                  {isAnonymous ? "Responses will be anonymous" : "Reviewer names will be visible"}
                </span>
             </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`${
                isAnonymous ? 'bg-green-600' : 'bg-amber-500'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500`}
              aria-pressed={isAnonymous}
            >
              <span className="sr-only">Toggle anonymity</span>
              <span
                className={`${
                  isAnonymous ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedSubjectId || selectedReviewerIds.length === 0 || !selectedCycleId || allCyclesSorted.length === 0 || !selectedTemplateId || allTemplatesSorted.length === 0}
            className="px-4 py-2 text-sm font-medium text-black bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            <span>Send Requests ({selectedReviewerIds.length})</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestFeedbackModal;