import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, FeedbackRequest, FeedbackResponseAnswer, FeedbackCycle, QuestionTemplate, FeedbackQuestion, UserHierarchyLevel, UserRole } from '../types'; // Adjusted path
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8080/api'; 

export const mapHierarchyToRole = (hierarchyLevel: UserHierarchyLevel): UserRole => {
  switch (hierarchyLevel) {
    case 'Team Head':
      return 'super-admin';
    case 'Group Head':
    case 'Part Lead':
      return 'admin';
    case 'Project Lead':
    case 'Engineer':
      return 'provider';
    default:
      console.warn(`Unknown hierarchy level: ${hierarchyLevel}, defaulting to provider.`);
      return 'provider';
  }
};

interface FeedbackContextType {
  users: User[];
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (userId: string) => void;
  logout: () => void;
  feedbackRequests: FeedbackRequest[];
  feedbackCycles: FeedbackCycle[];
  questionTemplates: QuestionTemplate[];
  isLoading: boolean; 
  initialDataLoaded: boolean;
  initialDataError: string | null;
  createFeedbackRequest: (subjectUserId: string, reviewerIds: string[], isAnonymous: boolean, cycleId: string, questions: FeedbackQuestion[], templateId: string) => Promise<void>;
  submitFeedbackResponse: (requestId: string, responses: FeedbackResponseAnswer[]) => Promise<void>;
  getFeedbackForCurrentUserToGive: () => FeedbackRequest[];
  getFeedbackRequestsSentByCurrentUser: () => FeedbackRequest[];
  getFeedbackReceivedForUser: (subjectId: string) => FeedbackRequest[];
  fetchAiSummary: (requestId: string) => Promise<void>;
  getActiveCycles: () => FeedbackCycle[];
  getCycleById: (cycleId: string) => FeedbackCycle | undefined;
  getTemplateById: (templateId: string) => QuestionTemplate | undefined;
  isCycleActive: (cycle?: FeedbackCycle) => boolean;
  getUsersInHierarchy: (managerId: string) => User[]; 
  getDirectReports: (userId: string) => User[]; 
  getManagedUsersAndTheirFeedback: () => { user: User, feedback: FeedbackRequest[] }[]; 
  getFeedbackRequestById: (requestId: string) => FeedbackRequest | undefined; 
  getAllFeedbackRequests: () => FeedbackRequest[];
  addFeedbackCycle: (cycle: Omit<FeedbackCycle, 'id'>) => Promise<void>;
  updateFeedbackCycle: (cycle: FeedbackCycle) => Promise<void>;
  deleteFeedbackCycle: (cycleId: string) => Promise<void>;
  addQuestionTemplate: (templateData: Omit<QuestionTemplate, 'id'>) => Promise<void>;
  updateQuestionTemplate: (updatedTemplate: QuestionTemplate) => Promise<void>;
  deleteQuestionTemplate: (templateId: string) => Promise<void>;
  isTemplateUsed: (templateId: string) => Promise<boolean>; 
  addUser: (userData: Omit<User, 'id' | 'role'>) => Promise<void>;
  updateUser: (userId: string, updatedUserPartialData: Partial<Omit<User, 'id' | 'role'>> & { hierarchyLevel: UserHierarchyLevel, reportsTo: string | null, name: string, email: string, avatarUrl: string }) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([]);
  const [feedbackCycles, setFeedbackCycles] = useState<FeedbackCycle[]>([]);
  const [questionTemplates, setQuestionTemplates] = useState<QuestionTemplate[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [initialDataLoading, setInitialDataLoading] = useState<boolean>(true); 
  const [initialDataError, setInitialDataError] = useState<string | null>(null);


  const fetchData = useCallback(async () => {
    setInitialDataLoading(true);
    setInitialDataError(null);
    try {
      const [usersRes, requestsRes, cyclesRes, templatesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/feedback-requests`),
        fetch(`${API_BASE_URL}/feedback-cycles`),
        fetch(`${API_BASE_URL}/question-templates`)
      ]);

      if (!usersRes.ok || !requestsRes.ok || !cyclesRes.ok || !templatesRes.ok) {
        let errorMsg = "Failed to fetch initial data. Server responded with an error. ";
        if (!usersRes.ok) errorMsg += `Users: ${usersRes.statusText}. `;
        if (!requestsRes.ok) errorMsg += `Requests: ${requestsRes.statusText}. `;
        if (!cyclesRes.ok) errorMsg += `Cycles: ${cyclesRes.statusText}. `;
        if (!templatesRes.ok) errorMsg += `Templates: ${templatesRes.statusText}. `;
        throw new Error(errorMsg);
      }

      const usersData = await usersRes.json() as User[]; 
      const requestsData = await requestsRes.json() as FeedbackRequest[];
      const cyclesData = await cyclesRes.json() as FeedbackCycle[];
      const templatesData = await templatesRes.json() as QuestionTemplate[];

      setUsers(usersData);
      setFeedbackRequests(requestsData);
      setFeedbackCycles(cyclesData);
      setQuestionTemplates(templatesData);
      
      const storedUserId = localStorage.getItem('feedbackPortal_currentUserId');
      if (storedUserId) {
          const fullUser = usersData.find(u => u.id === storedUserId);
          if (fullUser) {
              setCurrentUserState(fullUser); 
              setIsAuthenticated(true);
          } else {
              localStorage.removeItem('feedbackPortal_currentUserId');
              setCurrentUserState(null);
              setIsAuthenticated(false);
          }
      } else {
           setCurrentUserState(null);
           setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error fetching initial data from backend:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred while fetching data from backend.";
      setInitialDataError(message);
      setCurrentUserState(null);
      setIsAuthenticated(false);
      toast.error("Failed to load application data from backend. Please try again later.");
    } finally {
      setInitialDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('feedbackPortal_currentUserId', currentUser.id);
      setIsAuthenticated(true); 
    } else {
      localStorage.removeItem('feedbackPortal_currentUserId');
      setIsAuthenticated(false);
    }
  }, [currentUser]);


  const login = (userId: string) => {
    const userToLogin = users.find(u => u.id === userId);
    if (userToLogin) {
      setCurrentUserState(userToLogin);
      toast.success(`Welcome, ${userToLogin.name}!`);
    } else {
      toast.error("User not found.");
    }
  };

  const logout = () => {
    setCurrentUserState(null);
    toast.success("You have been logged out.");
  };
  
  const getUsersInHierarchy = useCallback((managerId: string): User[] => {
    if (initialDataLoading) return []; 
    const managedUsers: User[] = [];
    const findReports = (currentManagerId: string) => {
        const directReports = users.filter(u => u.reportsTo === currentManagerId);
        directReports.forEach(report => {
            managedUsers.push(report);
            findReports(report.id);
        });
    };
    findReports(managerId);
    return Array.from(new Set(managedUsers.map(u => u.id))).map(id => users.find(u => u.id === id)!);
  }, [users, initialDataLoading]);

  const getDirectReports = useCallback((userId: string): User[] => {
    if (initialDataLoading) return [];
    return users.filter(u => u.reportsTo === userId);
  }, [users, initialDataLoading]);


  const getActiveCycles = useCallback(() => {
    const now = new Date();
    return feedbackCycles.filter(cycle => {
        const startDate = new Date(cycle.startDate); 
        const endDate = new Date(cycle.endDate);
        endDate.setHours(23, 59, 59, 999); 
        return startDate <= now && endDate >= now;
    });
  }, [feedbackCycles]);

  const isCycleActive = useCallback((cycle?: FeedbackCycle): boolean => {
    if (!cycle) return false;
    const now = new Date();
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.endDate);
    endDate.setHours(23, 59, 59, 999);
    return startDate <= now && endDate >= now;
  }, []);
  
  const createFeedbackRequest = useCallback(async (subjectUserId: string, reviewerIds: string[], isAnonymous: boolean, cycleId: string, questions: FeedbackQuestion[], templateId: string) => {
    if (!currentUser) {
      toast.error("No current user session. Please log in.");
      return;
    }
    if (initialDataLoading) {
        toast.error("Data is still loading. Please wait.");
        return;
    }
    if (questions.length === 0) {
        toast.error("No questions selected. Please choose a template.");
        return;
    }

    const requestBody = {
        subjectUserId,
        reviewerIds,
        isAnonymous,
        cycleId,
        questions,
        templateIdOrigin: templateId,
        createdById: currentUser.id,
    };
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/feedback-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to create feedback requests`);
        }
        const newRequests = await response.json() as FeedbackRequest[];
        setFeedbackRequests(prev => [...prev, ...newRequests]);
        const subjectUser = users.find(u=>u.id === subjectUserId);
        const subjectName = subjectUser ? subjectUser.name : 'Selected User';
        toast.success(`Feedback requested from ${newRequests.length} reviewer(s) for ${subjectName}.`);
    } catch (error) {
        console.error("Error creating feedback request:", error);
        toast.error(error instanceof Error ? error.message : "Could not create feedback requests.");
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, users, initialDataLoading]);


  const submitFeedbackResponse = useCallback(async (requestId: string, responsesData: FeedbackResponseAnswer[]) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/feedback-requests/${requestId}/submit`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responses: responsesData }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to submit feedback`);
        }
        const updatedRequest = await response.json() as FeedbackRequest;
        setFeedbackRequests(prev => 
          prev.map(req => req.id === requestId ? updatedRequest : req)
        );
        toast.success("Feedback submitted successfully!");
    } catch (error) {
        console.error("Error submitting feedback response:", error);
        toast.error(error instanceof Error ? error.message : "Could not submit feedback.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const getFeedbackForCurrentUserToGive = useCallback(() => {
    if (!currentUser || initialDataLoading) return [];
    return feedbackRequests.filter(req => req.reviewerId === currentUser.id && req.status === 'pending');
  }, [currentUser, feedbackRequests, initialDataLoading]);

  const getFeedbackRequestsSentByCurrentUser = useCallback(() => {
    if (!currentUser || initialDataLoading) return [];
    return feedbackRequests.filter(req => req.subjectUserId === currentUser.id);
  }, [currentUser, feedbackRequests, initialDataLoading]);
  
  const getFeedbackReceivedForUser = useCallback((subjectId: string) => {
    if (initialDataLoading) return [];
    return feedbackRequests.filter(req => req.subjectUserId === subjectId && req.status === 'completed');
  }, [feedbackRequests, initialDataLoading]);

  const fetchAiSummary = useCallback(async (requestId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/feedback-requests/${requestId}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        if (errorData && errorData.id === requestId) {
           setFeedbackRequests(prev => prev.map(r => r.id === requestId ? errorData : r));
        }
        throw new Error(errorData.message || `Failed to get AI summary`);
      }
      const updatedRequestWithSummary = await response.json() as FeedbackRequest;
      setFeedbackRequests(prev => prev.map(r => r.id === requestId ? updatedRequestWithSummary : r));
      if (updatedRequestWithSummary.aiSummary) toast.success("AI summary generated!");
      if (updatedRequestWithSummary.aiSummaryError) toast.error(`AI Summary: ${updatedRequestWithSummary.aiSummaryError}`);

    } catch (error) {
      console.error("Error fetching AI summary:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI analysis.";
      setFeedbackRequests(prev => prev.map(r => r.id === requestId ? { ...r, aiSummaryError: errorMessage, aiSummary: undefined } : r));
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCycleById = useCallback((cycleId: string) => {
    if (initialDataLoading) return undefined;
    return feedbackCycles.find(c => c.id === cycleId);
  }, [feedbackCycles, initialDataLoading]);
  
  const getTemplateById = useCallback((templateId: string) => {
    if (initialDataLoading) return undefined;
    return questionTemplates.find(t => t.id === templateId);
  }, [questionTemplates, initialDataLoading]);

  const getManagedUsersAndTheirFeedback = useCallback(() => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super-admin')) return [];
    if (initialDataLoading) return [];

    let usersToViewFeedbackFor: User[] = [];
    if (currentUser.role === 'super-admin') {
        usersToViewFeedbackFor = users.filter(u => u.id !== currentUser.id); 
    } else if (currentUser.role === 'admin') {
        usersToViewFeedbackFor = getUsersInHierarchy(currentUser.id); 
    }

    return usersToViewFeedbackFor.map(user => ({
        user,
        feedback: getFeedbackReceivedForUser(user.id)
    }));
  }, [currentUser, users, initialDataLoading, getUsersInHierarchy, getFeedbackReceivedForUser]);

  const getFeedbackRequestById = useCallback((requestId: string) => {
    if (initialDataLoading) return undefined;
    return feedbackRequests.find(req => req.id === requestId);
  }, [feedbackRequests, initialDataLoading]);

  const getAllFeedbackRequests = useCallback(() => {
    if (initialDataLoading) return [];
    return feedbackRequests;
  }, [feedbackRequests, initialDataLoading]);

  const addFeedbackCycle = useCallback(async (cycleData: Omit<FeedbackCycle, 'id'>) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/feedback-cycles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cycleData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to create feedback cycle`);
        }
        const newCycle = await response.json() as FeedbackCycle;
        setFeedbackCycles(prev => [...prev, newCycle]);
        toast.success(`Feedback cycle "${newCycle.name}" created.`);
    } catch (error) {
        console.error("Error adding feedback cycle:", error);
        toast.error(error instanceof Error ? error.message : "Could not create cycle.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateFeedbackCycle = useCallback(async (updatedCycle: FeedbackCycle) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/feedback-cycles/${updatedCycle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCycle),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to update cycle`);
        }
        const returnedCycle = await response.json() as FeedbackCycle;
        setFeedbackCycles(prev => prev.map(c => c.id === returnedCycle.id ? returnedCycle : c));
        toast.success(`Feedback cycle "${returnedCycle.name}" updated.`);
    } catch (error) {
        console.error("Error updating feedback cycle:", error);
        toast.error(error instanceof Error ? error.message : "Could not update cycle.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const deleteFeedbackCycle = useCallback(async (cycleId: string) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/feedback-cycles/${cycleId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to delete cycle`);
        }
        setFeedbackCycles(prev => prev.filter(c => c.id !== cycleId));
        toast.success(`Feedback cycle deleted.`);
    } catch (error) {
        console.error("Error deleting feedback cycle:", error);
        toast.error(error instanceof Error ? error.message : "Could not delete cycle.");
    } finally {
        setIsLoading(false);
    }
  }, []);
  
  const isTemplateUsed = useCallback(async (templateId: string): Promise<boolean> => {
    if (initialDataLoading) return false; 
    try {
      const response = await fetch(`${API_BASE_URL}/question-templates/${templateId}/is-used`);
      if (!response.ok) throw new Error('Failed to check if template is used');
      const data = await response.json();
      return data.isUsed;
    } catch (error) {
      console.error("Error checking template usage:", error);
      toast.error("Could not verify template usage from server.");
      return feedbackRequests.some(req => req.templateIdOrigin === templateId); 
    }
  }, [feedbackRequests, initialDataLoading]);


  const addQuestionTemplate = useCallback(async (templateData: Omit<QuestionTemplate, 'id'>) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/question-templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templateData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to create template`);
        }
        const newTemplate = await response.json() as QuestionTemplate;
        setQuestionTemplates(prev => [...prev, newTemplate]);
        toast.success(`Question template "${newTemplate.name}" created.`);
    } catch (error) {
        console.error("Error adding question template:", error);
        toast.error(error instanceof Error ? error.message : "Could not create template.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateQuestionTemplate = useCallback(async (updatedTemplate: QuestionTemplate) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/question-templates/${updatedTemplate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTemplate),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to update template`);
        }
        const returnedTemplate = await response.json() as QuestionTemplate;
        setQuestionTemplates(prev => prev.map(qt => qt.id === returnedTemplate.id ? returnedTemplate : qt));
        toast.success(`Question template "${returnedTemplate.name}" updated.`);
    } catch (error) {
        console.error("Error updating question template:", error);
        toast.error(error instanceof Error ? error.message : "Could not update template.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const deleteQuestionTemplate = useCallback(async (templateId: string) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/question-templates/${templateId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to delete template`);
        }
        setQuestionTemplates(prev => prev.filter(qt => qt.id !== templateId));
        toast.success(`Question template deleted.`);
    } catch (error) {
        console.error("Error deleting question template:", error);
        toast.error(error instanceof Error ? error.message : "Could not delete template.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'role'>) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to create user`);
        }
        const newUser = await response.json() as User;
        setUsers(prev => [...prev, newUser]);
        toast.success(`User "${newUser.name}" created successfully.`);
    } catch (error) {
        console.error("Error adding user:", error);
        toast.error(error instanceof Error ? error.message : "Could not create user.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (userId: string, updatedUserData: Partial<Omit<User, 'id' | 'role'>> & { hierarchyLevel: UserHierarchyLevel, reportsTo: string | null, name: string, email: string, avatarUrl: string }) => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUserData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to update user`);
        }
        const returnedUser = await response.json() as User;
        setUsers(prevUsers => prevUsers.map(u => u.id === userId ? returnedUser : u));
        if (currentUser && currentUser.id === userId) {
            setCurrentUserState(returnedUser);
        }
        toast.success(`User "${returnedUser.name}" updated successfully.`);
    } catch (error) {
        console.error("Error updating user:", error);
        toast.error(error instanceof Error ? error.message : "Could not update user.");
    } finally {
        setIsLoading(false);
    }
  }, [currentUser]);

  const deleteUser = useCallback(async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      toast.error("User not found for deletion.");
      return;
    }
     if (!window.confirm(`Are you sure you want to delete user "${userToDelete.name}"? This action cannot be undone.`)){
        return;
    }

    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Failed to delete user`);
        }
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (currentUser && currentUser.id === userId) { 
            logout();
        }
        toast.success(`User "${userToDelete.name}" deleted.`);
    } catch (error) {
        console.error("Error deleting user:", error);
        toast.error(error instanceof Error ? error.message : "Could not delete user.");
    } finally {
        setIsLoading(false);
    }
  }, [users, currentUser, logout]);


  return (
    <FeedbackContext.Provider value={{
      users,
      currentUser,
      isAuthenticated,
      login,
      logout,
      feedbackRequests,
      feedbackCycles,
      questionTemplates,
      isLoading, 
      initialDataLoaded: !initialDataLoading, 
      initialDataError,
      createFeedbackRequest,
      submitFeedbackResponse,
      getFeedbackForCurrentUserToGive,
      getFeedbackRequestsSentByCurrentUser,
      getFeedbackReceivedForUser,
      fetchAiSummary,
      getActiveCycles,
      getCycleById,
      getTemplateById,
      isCycleActive,
      getUsersInHierarchy,
      getDirectReports,
      getManagedUsersAndTheirFeedback,
      getFeedbackRequestById,
      getAllFeedbackRequests,
      addFeedbackCycle,
      updateFeedbackCycle,
      deleteFeedbackCycle,
      addQuestionTemplate,
      updateQuestionTemplate,
      deleteQuestionTemplate,
      isTemplateUsed,
      addUser,
      updateUser,
      deleteUser,
    }}>
      {children}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};