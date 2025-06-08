import React, { useState } from 'react';
import { useFeedback } from '../contexts/FeedbackContext.tsx';
import AllRequestsView from '../components/admin/AllRequestsView';
import CycleManagementView from '../components/admin/CycleManagementView';
import TemplateManagementView from '../components/admin/TemplateManagementView';
import UserManagementView from '../components/admin/UserManagementView'; 
import { Cog6ToothIcon, ListBulletIcon, CalendarDaysIcon, DocumentTextIcon as TemplateIcon, UsersIcon as UserManagementIcon } from '@heroicons/react/24/outline';

type AdminTab = 'requests' | 'cycles' | 'templates' | 'users'; 

const AdminPage: React.FC = () => {
  const { currentUser } = useFeedback();
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super-admin')) {
    return <p className="text-red-500">Access Denied. Admin or Super Admin privileges required.</p>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return <AllRequestsView />;
      case 'cycles':
        return <CycleManagementView />;
      case 'templates':
        return <TemplateManagementView />;
      case 'users': 
        return <UserManagementView />;
      default:
        return null;
    }
  };

  const getTabClass = (tabName: AdminTab) => {
    return activeTab === tabName
      ? 'border-sky-500 text-sky-600'
      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Cog6ToothIcon className="h-8 w-8 text-sky-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Panel</h1>
          <p className="text-slate-600">Manage feedback requests, cycles, templates, and users.</p>
        </div>
      </div>

      <div>
        <div className="sm:hidden">
          <label htmlFor="admin-tabs" className="sr-only">Select a tab</label>
          <select
            id="admin-tabs"
            name="admin-tabs"
            className="block w-full rounded-md border-slate-300 focus:border-sky-500 focus:ring-sky-500 p-2 shadow-sm"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as AdminTab)}
          >
            <option value="requests">All Feedback Requests</option>
            <option value="cycles">Manage Cycles</option>
            <option value="templates">Question Templates</option> 
            <option value="users">User Management</option> 
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('requests')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${getTabClass('requests')}`}
              >
                <ListBulletIcon className="h-5 w-5" />
                <span>All Feedback Requests</span>
              </button>
              <button
                onClick={() => setActiveTab('cycles')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${getTabClass('cycles')}`}
              >
                <CalendarDaysIcon className="h-5 w-5" />
                <span>Manage Cycles</span>
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${getTabClass('templates')}`}
              >
                <TemplateIcon className="h-5 w-5" />
                <span>Question Templates</span>
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${getTabClass('users')}`}
              >
                <UserManagementIcon className="h-5 w-5" />
                <span>User Management</span>
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminPage;