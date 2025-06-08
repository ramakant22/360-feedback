import React from 'react';
import { FeedbackRequest, FeedbackQuestion } from '../../types';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import StarRatingDisplay from '../shared/StarRatingDisplay';
import { SparklesIcon, ExclamationTriangleIcon, ArrowPathIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface ReceivedFeedbackCardProps {
  request: FeedbackRequest;
  reviewerName: string;
}

const ReceivedFeedbackCard: React.FC<ReceivedFeedbackCardProps> = ({ request, reviewerName }) => {
  const { fetchAiSummary, isLoading: contextIsLoading, users } = useFeedback();
  const [isCardLoading, setIsCardLoading] = React.useState(false);

  const findQuestionText = (questionId: string, questions: FeedbackQuestion[]): string => {
    const question = questions.find(q => q.id === questionId);
    return question ? question.text : 'Unknown Question';
  };
  
  const reviewerAvatar = users.find(u => u.id === request.reviewerId)?.avatarUrl || 'https://via.placeholder.com/40';


  const handleAnalyzeClick = async () => {
    setIsCardLoading(true);
    await fetchAiSummary(request.id);
    setIsCardLoading(false);
  };
  
  const isLoading = contextIsLoading && isCardLoading;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg transition-shadow hover:shadow-xl duration-200">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 pb-4 border-b border-slate-200">
        <div className="flex items-center mb-3 sm:mb-0">
           {!request.isAnonymous && <img src={reviewerAvatar} alt={reviewerName} className="h-10 w-10 rounded-full mr-3 object-cover" />}
           {request.isAnonymous && <ChatBubbleLeftRightIcon className="h-10 w-10 text-slate-400 mr-3 p-1.5 bg-slate-100 rounded-full"/>}
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Feedback from: <span className={request.isAnonymous ? "italic text-slate-600" : "font-bold text-sky-700"}>{reviewerName}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Completed: {request.dateCompleted ? new Date(request.dateCompleted).toLocaleDateString() : 'N/A'}
               {request.isAnonymous && <span className="ml-2 px-1.5 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full">Anonymous</span>}
            </p>
          </div>
        </div>
        {!request.aiSummary && !request.aiSummaryError && (
           <button
            onClick={handleAnalyzeClick}
            disabled={isLoading}
            className="bg-sky-500 hover:bg-sky-600 text-black font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-2 transition-colors disabled:opacity-50 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
          >
            {isLoading ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
            <span>{isLoading ? 'Analyzing...' : 'AI Summary'}</span>
          </button>
        )}
      </div>

      {request.responses && request.responses.length > 0 ? (
        <div className="space-y-4 mb-5">
          {request.responses.map((response, index) => (
            <div key={index} className="pb-3 last:border-b-0 last:pb-0">
              <p className="font-medium text-slate-600 text-sm">{findQuestionText(response.questionId, request.questions)}</p>
              {response.rating !== undefined && (
                <div className="mt-1.5">
                  <StarRatingDisplay rating={response.rating} size={18} />
                </div>
              )}
              {response.textResponse && (
                <p className="text-slate-700 mt-1.5 whitespace-pre-wrap bg-slate-50 p-3 rounded-md text-sm border border-slate-200">{response.textResponse}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 italic text-sm py-3">No specific responses recorded for this feedback.</p>
      )}

      {request.aiSummary && (
        <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <SparklesIcon className="h-6 w-6 text-sky-600" />
            <h4 className="text-md font-semibold text-sky-700">AI Generated Summary</h4>
          </div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: request.aiSummary.replace(/\n/g, '<br />') }}></div>
        </div>
      )}
      {request.aiSummaryError && (
         <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <h4 className="text-md font-semibold text-red-700">AI Summary Error</h4>
          </div>
          <p className="text-sm text-red-700">{request.aiSummaryError}</p>
          <button
            onClick={handleAnalyzeClick}
            disabled={isLoading}
            className="mt-3 bg-red-500 hover:bg-red-600 text-black font-semibold py-1.5 px-3 rounded-md text-xs flex items-center space-x-1 transition-colors disabled:opacity-50"
          >
            {isLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ArrowPathIcon className="h-4 w-4" />}
            <span>Retry</span>
          </button>
        </div>
      )}
       {isLoading && !request.aiSummary && !request.aiSummaryError && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <ArrowPathIcon className="h-6 w-6 text-slate-500 animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-600">Generating AI summary...</p>
        </div>
      )}
    </div>
  );
};

export default ReceivedFeedbackCard;