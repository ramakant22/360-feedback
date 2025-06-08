import React, { useState, useEffect } from 'react';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import { QuestionTemplate, FeedbackQuestion } from '../../types';
import toast from 'react-hot-toast';
import { DocumentTextIcon as TemplateIcon, PlusCircleIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, EyeIcon, LockClosedIcon, LockOpenIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Modal from '../shared/Modal';

type QuestionCategory = FeedbackQuestion['category'];

const TemplateManagementView: React.FC = () => {
  const { questionTemplates, addQuestionTemplate, updateQuestionTemplate, deleteQuestionTemplate, isTemplateUsed } = useFeedback();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionTemplate | null>(null);
  
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [currentQuestions, setCurrentQuestions] = useState<FeedbackQuestion[]>([]);

  const [templateUsageStatus, setTemplateUsageStatus] = useState<Record<string, boolean | 'loading'>>({});
  const [editingTemplateIsLocked, setEditingTemplateIsLocked] = useState(false);

  useEffect(() => {
    const fetchUsageStatusForAll = async () => {
      if (questionTemplates.length === 0) {
        setTemplateUsageStatus({});
        return;
      }

      const initialUpdates: Record<string, boolean | 'loading'> = {};
      questionTemplates.forEach(template => {
        if (templateUsageStatus[template.id] === undefined || templateUsageStatus[template.id] === 'loading') { 
          initialUpdates[template.id] = 'loading';
        }
      });
      if (Object.keys(initialUpdates).length > 0) {
        setTemplateUsageStatus(prev => ({ ...prev, ...initialUpdates }));
      }

      for (const template of questionTemplates) {
        if (initialUpdates[template.id] === 'loading') { 
          try {
            const isUsedResult = await isTemplateUsed(template.id);
            setTemplateUsageStatus(prevStatus => ({ ...prevStatus, [template.id]: isUsedResult }));
          } catch (error) {
            console.error(`Failed to fetch usage status for template ${template.id}`, error);
            setTemplateUsageStatus(prevStatus => ({ ...prevStatus, [template.id]: false })); 
          }
        }
      }
    };

    fetchUsageStatusForAll();
  }, [questionTemplates, isTemplateUsed, templateUsageStatus]); // Added templateUsageStatus to dependencies to re-run if a template is added/deleted and status needs reset

  const openCreateModal = () => {
    setEditingTemplate(null);
    setEditingTemplateIsLocked(false);
    setTemplateName('');
    setTemplateDescription('');
    setCurrentQuestions([{ id: `q-${Date.now()}`, text: '', type: 'text', category: 'General Comments' }]);
    setIsModalOpen(true);
  };

  const openEditModal = async (template: QuestionTemplate) => {
    const isCurrentlyUsed = await isTemplateUsed(template.id);
    setEditingTemplateIsLocked(isCurrentlyUsed);

    if (isCurrentlyUsed) {
      toast.error("This template is in use and cannot be edited. You can view its details.");
    }
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setCurrentQuestions(template.questions.map(q => ({...q}))); 
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setEditingTemplateIsLocked(false);
    setTemplateName('');
    setTemplateDescription('');
    setCurrentQuestions([]);
  };

  const handleQuestionChange = (index: number, field: keyof FeedbackQuestion, value: string | QuestionCategory) => {
    const updatedQuestions = [...currentQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setCurrentQuestions(updatedQuestions);
  };

  const addQuestionField = () => {
    setCurrentQuestions([
      ...currentQuestions,
      { id: `q-${Date.now()}-${currentQuestions.length}`, text: '', type: 'text', category: 'General Comments' }
    ]);
  };

  const removeQuestionField = (index: number) => {
    if (currentQuestions.length <= 1) {
      toast.error("A template must have at least one question.");
      return;
    }
    const updatedQuestions = currentQuestions.filter((_, i) => i !== index);
    setCurrentQuestions(updatedQuestions);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Template name is required.');
      return;
    }
    if (currentQuestions.some(q => !q.text.trim())) {
      toast.error('All questions must have text.');
      return;
    }
    if (currentQuestions.length === 0) {
      toast.error('A template must have at least one question.');
      return;
    }

    if (editingTemplate) {
      if (editingTemplateIsLocked) {
        toast.error("This template is in use and cannot be saved. Close the modal or view details only.");
        return;
      }
    }


    const templateData = { 
      name: templateName, 
      description: templateDescription, 
      questions: currentQuestions.map((q, idx) => ({
        ...q, 
        id: q.id || `q_final_${idx}_${Date.now()}` 
      }))
    };

    if (editingTemplate) {
      updateQuestionTemplate({ ...editingTemplate, ...templateData });
    } else {
      addQuestionTemplate(templateData);
    }
    closeModal();
  };
  
  const handleDeleteTemplate = async (templateId: string) => {
    const template = questionTemplates.find(t => t.id === templateId);
    if (!template) return;

    const isCurrentlyUsed = await isTemplateUsed(templateId);
    if (isCurrentlyUsed) {
        toast.error(`Template "${template.name}" is in use and cannot be deleted.`);
        return;
    }
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`)) {
        deleteQuestionTemplate(templateId);
    }
  };
  
  const questionCategories: QuestionCategory[] = ['Strengths', 'Areas for Improvement', 'General Comments'];
  const sortedTemplates = [...questionTemplates].sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-700 flex items-center">
          <TemplateIcon className="h-6 w-6 mr-2 text-sky-600" /> Manage Question Templates
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-sky-600 hover:bg-sky-700 text-black font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-colors flex items-center space-x-2"
        >
          <PlusCircleIcon className="h-5 w-5" />
          <span>New Template</span>
        </button>
      </div>

      {sortedTemplates.length === 0 ? (
        <div className="text-center py-10">
          <TemplateIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No question templates found.</p>
          <p className="text-sm text-slate-400">Click "New Template" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTemplates.map(template => {
            const usedStatus = templateUsageStatus[template.id];
            const isItemLocked = usedStatus === true;
            return (
              <div key={template.id} className={`p-4 border rounded-lg hover:shadow-md transition-shadow bg-white ${isItemLocked ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2">
                        {usedStatus === 'loading' && <ArrowPathIcon title="Checking usage..." className="h-5 w-5 text-slate-400 animate-spin flex-shrink-0" />}
                        {usedStatus === true && <LockClosedIcon title="Template is in use (locked)" className="h-5 w-5 text-amber-600 flex-shrink-0" />}
                        {usedStatus === false && <LockOpenIcon title="Template is not in use (unlocked)" className="h-5 w-5 text-green-600 flex-shrink-0" />}
                        {(usedStatus === undefined) && <TemplateIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />}
                        <h4 className="text-md font-semibold text-slate-800">{template.name}</h4>
                    </div>
                    <p className="text-sm text-slate-500 ml-7">{template.description || 'No description.'}</p>
                    <p className="text-xs text-slate-400 ml-7">{template.questions.length} question(s)</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-3 sm:mt-0 self-start sm:self-center">
                    <button 
                        onClick={() => openEditModal(template)} 
                        className={`p-1.5 text-slate-500 hover:bg-slate-100 rounded-md flex items-center space-x-1 text-xs
                                    ${isItemLocked ? 'hover:text-amber-700' : 'hover:text-sky-600'}`}
                        title={isItemLocked ? "View Template Details" : "Edit Template"}
                        disabled={usedStatus === 'loading'}
                    >
                      {isItemLocked ? <EyeIcon className="h-4 w-4" /> : <PencilIcon className="h-4 w-4" />}
                      <span>{isItemLocked ? 'View' : 'Edit'}</span>
                    </button>
                    {!isItemLocked && usedStatus !== 'loading' && (
                      <button 
                          onClick={() => handleDeleteTemplate(template.id)} 
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md flex items-center space-x-1 text-xs"
                          title="Delete Template"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            title={editingTemplate ? (editingTemplateIsLocked ? `View Template: ${editingTemplate.name}` : `Edit Template: ${editingTemplate.name}`) : 'Create New Question Template'}
            size="2xl"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSaveTemplate(); }} className="space-y-5">
            <div>
              <label htmlFor="templateName" className="block text-sm font-medium text-slate-700">Template Name</label>
              <input
                type="text"
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
                placeholder="e.g., Annual Performance Review"
                required
                disabled={editingTemplateIsLocked}
              />
            </div>
            <div>
              <label htmlFor="templateDescription" className="block text-sm font-medium text-slate-700">Description (Optional)</label>
              <textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
                placeholder="A brief description of this template's purpose."
                disabled={editingTemplateIsLocked}
              />
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-md font-semibold text-slate-700">Questions</h4>
              {currentQuestions.map((q, index) => (
                <div key={q.id || `q-idx-${index}`} className="p-3 border border-slate-200 rounded-lg bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-slate-600">Question {index + 1}</p>
                    {!editingTemplateIsLocked && currentQuestions.length > 1 && (
                      <button type="button" onClick={() => removeQuestionField(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`q-text-${index}`} className="block text-xs font-medium text-slate-600">Text</label>
                    <textarea
                      id={`q-text-${index}`}
                      value={q.text}
                      onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                      rows={2}
                      className="mt-0.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-1.5"
                      placeholder="Enter question text"
                      required
                      disabled={editingTemplateIsLocked}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`q-type-${index}`} className="block text-xs font-medium text-slate-600">Type</label>
                      <select
                        id={`q-type-${index}`}
                        value={q.type}
                        onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                        className="mt-0.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-1.5"
                        disabled={editingTemplateIsLocked}
                      >
                        <option value="text">Text Response</option>
                        <option value="rating">Rating (1-5 Stars)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`q-category-${index}`} className="block text-xs font-medium text-slate-600">Category</label>
                      <select
                        id={`q-category-${index}`}
                        value={q.category}
                        onChange={(e) => handleQuestionChange(index, 'category', e.target.value as QuestionCategory)}
                        className="mt-0.5 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-1.5"
                        disabled={editingTemplateIsLocked}
                      >
                        {questionCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {!editingTemplateIsLocked && (
                <button
                  type="button"
                  onClick={addQuestionField}
                  className="mt-2 w-full text-sm text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md py-2 px-3 flex items-center justify-center space-x-2"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  <span>Add Question</span>
                </button>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-sm"
              >
                {editingTemplateIsLocked ? 'Close' : 'Cancel'}
              </button>
              {!editingTemplateIsLocked && (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-black bg-green-600 hover:bg-green-700 rounded-lg shadow-sm flex items-center space-x-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  <span>{editingTemplate ? 'Save Changes' : 'Create Template'}</span>
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TemplateManagementView;