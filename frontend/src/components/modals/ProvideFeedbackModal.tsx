import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import { FeedbackRequest, FeedbackResponseAnswer, FeedbackQuestion, FeedbackCycle } from '../../types';
import StarInput from '../shared/StarInput';
import toast from 'react-hot-toast';
import { ChatBubbleLeftEllipsisIcon, CalendarDaysIcon, ExclamationTriangleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface ProvideFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FeedbackRequest;
  subjectName: string;
}

const ProvideFeedbackModal: React.FC<ProvideFeedbackModalProps> = ({ isOpen, onClose, request, subjectName }) => {
  const { submitFeedbackResponse, getCycleById, isCycleActive: checkCycleActive } = useFeedback();
  const [responses, setResponses] = useState<FeedbackResponseAnswer[]>([]);
  const [cycle, setCycle] = useState<FeedbackCycle | undefined>(undefined);
  const [isCurrentCycleActive, setIsCurrentCycleActive] = useState<boolean>(true); 

  useEffect(() => {
    if (isOpen) {
      const initialResponses = request.questions.map(q => ({
        questionId: q.id,
        rating: q.type === 'rating' ? 0 : undefined,
        textResponse: q.type === 'text' ? '' : undefined,
      }));
      setResponses(initialResponses);

      if (request.cycleId) {
        const currentCycle = getCycleById(request.cycleId);
        setCycle(currentCycle);
        setIsCurrentCycleActive(checkCycleActive(currentCycle));
      } else {
        setIsCurrentCycleActive(true); 
        setCycle(undefined);
      }
    }
  }, [isOpen, request.questions, request.cycleId, getCycleById, checkCycleActive]);

  const handleInputChange = (questionId: string, value: string | number) => {
    setResponses(prev =>
      prev.map(r =>
        r.questionId === questionId
          ? typeof value === 'number' ? { ...r, rating: value } : { ...r, textResponse: value }
          : r
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentCycleActive && cycle) { 
      toast.error(`This feedback cycle "${cycle.name}" is not currently active for submissions.`);
      return;
    }

    for (const res of responses) {
      const question = request.questions.find(q => q.id === res.questionId);
      if (question?.type === 'rating' && (res.rating === undefined || res.rating === 0)) {
        toast.error(`Please provide a rating for: "${question.text}"`);
        return;
      }
    }
    submitFeedbackResponse(request.id, responses);
    onClose();
  };
  
  const groupQuestionsByCategory = (questions: FeedbackQuestion[]) => {
    return questions.reduce((acc, q) => {
      (acc[q.category] = acc[q.category] || []).push(q);
      return acc;
    }, {} as Record<FeedbackQuestion['category'], FeedbackQuestion[]>);
  };

  const groupedQuestions = groupQuestionsByCategory(request.questions);
  const title = request.isAnonymous ? "Provide Anonymous Feedback" : `Provide Feedback for ${subjectName}`;
  const subjectDisplay = request.isAnonymous ? "(Subject name hidden for anonymity)" : subjectName;


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-5">
         {!request.isAnonymous && (
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-700">Feedback For:</p>
                <p className="text-slate-800 text-base">{subjectDisplay}</p>
            </div>
        )}
        {cycle && (
          <div className={`p-3.5 rounded-lg border ${isCurrentCycleActive ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-400'}`}>
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className={`h-5 w-5 ${isCurrentCycleActive ? 'text-green-600' : 'text-yellow-600'}`} />
              <p className={`text-sm font-medium ${isCurrentCycleActive ? 'text-green-700' : 'text-yellow-700'}`}>
                Feedback Cycle: {cycle.name}
              </p>
            </div>
            <p className={`text-xs mt-1 ${isCurrentCycleActive ? 'text-green-600' : 'text-yellow-600'}`}>
              {isCurrentCycleActive ? 'This cycle is currently active for submissions.' : 'This cycle is not currently active for submissions.'}
              <br />
              (Runs from {new Date(cycle.startDate+"T00:00:00Z").toLocaleDateString()} to {new Date(cycle.endDate+"T00:00:00Z").toLocaleDateString()})
            </p>
          </div>
        )}
        {!cycle && request.cycleId && (
             <div className="p-3.5 rounded-lg border bg-red-50 border-red-300">
                <div className="flex items-center space-x-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-red-700">
                        Warning: Associated feedback cycle details (ID: {request.cycleId}) could not be found.
                    </p>
                </div>
                 <p className="text-xs text-red-600 mt-1">Submission might be affected. Contact admin if this persists.</p>
             </div>
        )}


        {Object.entries(groupedQuestions).map(([category, questionsInCategory]) => (
          <div key={category} className="pt-2">
            <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b border-slate-200 pb-2">{category}</h3>
            {questionsInCategory.map(question => {
              const response = responses.find(r => r.questionId === question.id);
              return (
                <div key={question.id} className="mb-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <label htmlFor={`question-${question.id}`} className="block text-sm font-medium text-slate-700 mb-1.5">
                    {question.text}
                  </label>
                  {question.type === 'rating' && (
                    <StarInput
                      count={5}
                      value={response?.rating || 0}
                      onChange={(rating) => handleInputChange(question.id, rating)}
                      disabled={cycle && !isCurrentCycleActive}
                      size={28}
                    />
                  )}
                  {question.type === 'text' && (
                    <textarea
                      id={`question-${question.id}`}
                      rows={3}
                      value={response?.textResponse || ''}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2.5 placeholder-slate-400"
                      placeholder="Your detailed response..."
                      disabled={cycle && !isCurrentCycleActive}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={cycle && !isCurrentCycleActive}
            className="px-4 py-2 text-sm font-medium text-black bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <PencilSquareIcon className="h-5 w-5" />
            <span>Submit Feedback</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProvideFeedbackModal;