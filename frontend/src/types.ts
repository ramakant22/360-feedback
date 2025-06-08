export type UserHierarchyLevel = 'Team Head' | 'Group Head' | 'Part Lead' | 'Project Lead' | 'Engineer';
export type UserRole = 'super-admin' | 'admin' | 'provider';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: UserRole; // Updated: 'super-admin', 'admin', or 'provider'
  hierarchyLevel: UserHierarchyLevel;
  reportsTo: string | null; // ID of the user they report to, null for top level (Team Head)
}

export interface FeedbackQuestion {
  id:string; // Should be unique within a template at the time of creation
  text: string;
  type: 'rating' | 'text'; 
  category: 'Strengths' | 'Areas for Improvement' | 'General Comments';
}

export interface QuestionTemplate {
  id: string;
  name: string;
  description?: string;
  questions: FeedbackQuestion[];
}

export interface FeedbackResponseAnswer {
  questionId: string;
  rating?: number; 
  textResponse?: string; 
}

export interface FeedbackRequest {
  id: string;
  subjectUserId: string; 
  reviewerId: string;    
  status: 'pending' | 'completed' | 'declined';
  questions: FeedbackQuestion[]; // These will now come from a selected template
  responses?: FeedbackResponseAnswer[];
  dateRequested: string;
  dateCompleted?: string;
  isAnonymous: boolean;
  aiSummary?: string;
  aiSummaryError?: string;
  cycleId?: string; // Associated feedback cycle
  createdById: string; // User ID of who created/initiated the request
  templateIdOrigin?: string; // ID of the QuestionTemplate used to create these questions
}

export interface FeedbackCycle {
  id: string;
  name: string;
  startDate: string; // Stored as ISO string, parsed to Date when needed
  endDate: string;   // Stored as ISO string, parsed to Date when needed
}