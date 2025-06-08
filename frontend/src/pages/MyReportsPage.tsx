import React from 'react';
import { useFeedback } from '../contexts/FeedbackContext.tsx';
import ReceivedFeedbackCard from '../components/feedback/ReceivedFeedbackCard.tsx';
import { DocumentChartBarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { FeedbackRequest } from '../types'; // Removed FeedbackResponseAnswer as it's not directly used
import RatingDistributionChart from '../components/reports/RatingDistributionChart.tsx';

const MyReportsPage: React.FC = () => {
  const { currentUser, getFeedbackReceivedForUser, users } = useFeedback(); 

  if (!currentUser) return null; 

  const receivedFeedback = getFeedbackReceivedForUser(currentUser.id); 

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

  const aggregatedRatingData = aggregateRatings(receivedFeedback);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Feedback Reports</h1>
          <p className="text-slate-600">View all completed feedback you've received.</p>
        </div>
         <DocumentChartBarIcon className="h-10 w-10 text-sky-600 hidden sm:block" />
      </div>

      {receivedFeedback.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <ChartBarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-semibold">You have not received any feedback yet.</p>
          <p className="text-slate-500 mt-2">Once feedback is submitted for you, it will appear here.</p>
        </div>
      ) : (
        <>
          {aggregatedRatingData.length > 0 && (
            <section className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-semibold text-slate-700 mb-4">Overall Rating Summaries</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aggregatedRatingData.map(data => (
                  <div key={data.questionText} className="p-4 border rounded-lg bg-slate-50">
                     <h3 className="text-md font-medium text-slate-600 mb-2">{data.questionText}</h3>
                    <RatingDistributionChart ratings={data.ratings} />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-6">
             <h2 className="text-xl font-semibold text-slate-700 mb-0">Individual Feedback Details</h2>
            {receivedFeedback.map(request => (
              <ReceivedFeedbackCard 
                key={request.id} 
                request={request} 
                reviewerName={request.isAnonymous ? 'Anonymous Reviewer' : findReviewerName(request.reviewerId)}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
};

export default MyReportsPage;