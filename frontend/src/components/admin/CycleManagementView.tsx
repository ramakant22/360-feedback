import React, { useState } from 'react';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import { FeedbackCycle } from '../../types';
import toast from 'react-hot-toast';
import { CalendarDaysIcon, PlusCircleIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CycleManagementView: React.FC = () => {
  const { feedbackCycles, addFeedbackCycle, updateFeedbackCycle, deleteFeedbackCycle, isCycleActive } = useFeedback();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingCycle, setEditingCycle] = useState<FeedbackCycle | null>(null);
  
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleStartDate, setNewCycleStartDate] = useState('');
  const [newCycleEndDate, setNewCycleEndDate] = useState('');

  const handleAddCycle = () => {
    if (!newCycleName.trim() || !newCycleStartDate || !newCycleEndDate) {
      toast.error('Please fill in all fields for the new cycle.');
      return;
    }
    if (new Date(newCycleStartDate) >= new Date(newCycleEndDate)) {
      toast.error('Start date must be before end date.');
      return;
    }
    addFeedbackCycle({ name: newCycleName, startDate: newCycleStartDate, endDate: newCycleEndDate });
    setNewCycleName('');
    setNewCycleStartDate('');
    setNewCycleEndDate('');
    setIsAdding(false);
  };

  const handleEditCycle = (cycle: FeedbackCycle) => {
    setEditingCycle(cycle);
    setNewCycleName(cycle.name);
    setNewCycleStartDate(cycle.startDate); 
    setNewCycleEndDate(cycle.endDate);
  };

  const handleUpdateCycle = () => {
    if (!editingCycle || !newCycleName.trim() || !newCycleStartDate || !newCycleEndDate) {
      toast.error('Please fill in all fields.');
      return;
    }
     if (new Date(newCycleStartDate) >= new Date(newCycleEndDate)) {
      toast.error('Start date must be before end date.');
      return;
    }
    updateFeedbackCycle({ ...editingCycle, name: newCycleName, startDate: newCycleStartDate, endDate: newCycleEndDate });
    setEditingCycle(null);
    setNewCycleName('');
    setNewCycleStartDate('');
    setNewCycleEndDate('');
  };
  
  const sortedCycles = [...feedbackCycles].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-700 flex items-center">
          <CalendarDaysIcon className="h-6 w-6 mr-2 text-sky-600" /> Manage Feedback Cycles
        </h2>
        {!isAdding && !editingCycle && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-sky-600 hover:bg-sky-700 text-black font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-colors flex items-center space-x-2"
          >
            <PlusCircleIcon className="h-5 w-5" />
            <span>New Cycle</span>
          </button>
        )}
      </div>

      {(isAdding || editingCycle) && (
        <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4 shadow">
          <h3 className="text-lg font-medium text-slate-700">{editingCycle ? 'Edit Cycle' : 'Add New Cycle'}</h3>
          <div>
            <label htmlFor="cycleName" className="block text-sm font-medium text-slate-700">Cycle Name</label>
            <input
              type="text"
              id="cycleName"
              value={newCycleName}
              onChange={(e) => setNewCycleName(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
              placeholder="e.g., Q1 2025 Review"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                id="startDate"
                value={newCycleStartDate}
                onChange={(e) => setNewCycleStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                id="endDate"
                value={newCycleEndDate}
                onChange={(e) => setNewCycleEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => { setIsAdding(false); setEditingCycle(null); setNewCycleName(''); setNewCycleStartDate(''); setNewCycleEndDate(''); }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm"
            >
              <XMarkIcon className="h-5 w-5 inline mr-1" /> Cancel
            </button>
            <button
              onClick={editingCycle ? handleUpdateCycle : handleAddCycle}
              className="px-4 py-2 text-sm font-medium text-black bg-green-600 hover:bg-green-700 rounded-md shadow-sm flex items-center space-x-2"
            >
              <CheckIcon className="h-5 w-5" /><span>{editingCycle ? 'Save Changes' : 'Create Cycle'}</span>
            </button>
          </div>
        </div>
      )}

      {sortedCycles.length === 0 && !isAdding ? (
         <div className="text-center py-10">
            <CalendarDaysIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No feedback cycles found.</p>
            <p className="text-sm text-slate-400">Click "New Cycle" to create one.</p>
        </div>
      ) : (
      <div className="space-y-3">
        {sortedCycles.map(cycle => {
          const isActive = isCycleActive(cycle);
          return (
          <div key={cycle.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow bg-white">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <h4 className="text-md font-semibold text-slate-800">{cycle.name}</h4>
                <p className="text-sm text-slate-500">
                  {new Date(cycle.startDate + "T00:00:00Z").toLocaleDateString()} - {new Date(cycle.endDate + "T00:00:00Z").toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => handleEditCycle(cycle)} className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-md" title="Edit Cycle">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button 
                    onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the cycle "${cycle.name}"? This action cannot be undone.`)) {
                            deleteFeedbackCycle(cycle.id);
                        }
                    }} 
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete Cycle"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )})}
      </div>
      )}
    </div>
  );
};

export default CycleManagementView;