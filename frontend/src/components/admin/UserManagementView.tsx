import React, { useState, useMemo } from 'react';
import { useFeedback, mapHierarchyToRole } from '../../contexts/FeedbackContext.tsx';
import { User, UserHierarchyLevel } from '../../types';
import toast from 'react-hot-toast';
import { UsersIcon as UserManagementIcon, PlusCircleIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Modal from '../shared/Modal';

const UserManagementView: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser: loggedInUser } = useFeedback();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userAvatarUrl, setUserAvatarUrl] = useState('');
  const [userHierarchyLevel, setUserHierarchyLevel] = useState<UserHierarchyLevel>('Engineer');
  const [userReportsTo, setUserReportsTo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const hierarchyLevels: UserHierarchyLevel[] = ['Team Head', 'Group Head', 'Part Lead', 'Project Lead', 'Engineer'];

  const openCreateModal = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserAvatarUrl('https://picsum.photos/seed/newuser/100/100'); 
    setUserHierarchyLevel('Engineer');
    setUserReportsTo(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserAvatarUrl(user.avatarUrl);
    setUserHierarchyLevel(user.hierarchyLevel);
    setUserReportsTo(user.reportsTo);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = () => {
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('User name and email are required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(userEmail)) {
        toast.error('Please enter a valid email address.');
        return;
    }

    if (userHierarchyLevel !== 'Team Head' && !userReportsTo) {
        toast.error('Please select who this user reports to (manager). Only Team Heads can have no manager.');
        return;
    }
     if (editingUser && userReportsTo === editingUser.id) {
        toast.error('A user cannot report to themselves.');
        return;
    }


    const userData = { 
      name: userName, 
      email: userEmail,
      avatarUrl: userAvatarUrl || `https://picsum.photos/seed/${userEmail}/100/100`, 
      hierarchyLevel: userHierarchyLevel,
      reportsTo: userHierarchyLevel === 'Team Head' ? null : userReportsTo,
    };

    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }
    closeModal();
  };
  
  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (user.id === loggedInUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    deleteUser(userId);
  };
  
  const potentialManagers = useMemo(() => {
    return users.filter(u => !editingUser || u.id !== editingUser.id) 
                .sort((a,b) => a.name.localeCompare(b.name));
  }, [users, editingUser]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.hierarchyLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.reportsTo && users.find(m => m.id === user.reportsTo)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [users, searchTerm]);

  const getManagerName = (userId: string | null) => {
    if (!userId) return 'N/A (Top Level)';
    return users.find(u => u.id === userId)?.name || 'Unknown Manager';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-slate-700 flex items-center">
          <UserManagementIcon className="h-6 w-6 mr-2 text-sky-600" /> Manage Users
        </h2>
        <button
          onClick={openCreateModal}
          className="bg-sky-600 hover:bg-sky-700 text-black font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-colors flex items-center space-x-2 w-full sm:w-auto"
        >
          <PlusCircleIcon className="h-5 w-5" />
          <span>Add New User</span>
        </button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        </div>
        <input
            type="text"
            placeholder="Search users by name, email, level, manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm shadow-sm"
        />
      </div>


      {filteredUsers.length === 0 && !isModalOpen ? (
        <div className="text-center py-10">
          <UserManagementIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No users found{searchTerm ? ' matching your search' : ''}.</p>
          {!searchTerm && <p className="text-sm text-slate-400">Click "Add New User" to create one.</p>}
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 bg-white">
            <thead className="bg-slate-50">
                <tr>
                    {['User', 'Email', 'Hierarchy Level', 'Role', 'Reports To', 'Actions'].map(header => (
                        <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                                <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full mr-2.5 object-cover flex-shrink-0"/>
                                <span className="text-sm font-medium text-slate-800">{user.name}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{user.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{user.hierarchyLevel}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 capitalize">{user.role.replace('-', ' ')}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{getManagerName(user.reportsTo)}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                            <button onClick={() => openEditModal(user)} className="text-sky-600 hover:text-sky-800 p-1 hover:bg-sky-50 rounded-md" title="Edit User">
                                <PencilIcon className="h-4 w-4"/>
                            </button>
                            {loggedInUser?.id !== user.id && (
                                <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-md" title="Delete User">
                                    <TrashIcon className="h-4 w-4"/>
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            title={editingUser ? `Edit User: ${editingUser.name}` : 'Add New User'}
            size="lg"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }} className="space-y-5">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
                required />
            </div>
            <div>
              <label htmlFor="userEmail" className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email" id="userEmail" value={userEmail} onChange={(e) => setUserEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
                required />
            </div>
             <div>
              <label htmlFor="userAvatarUrl" className="block text-sm font-medium text-slate-700">Avatar URL (Optional)</label>
              <input
                type="url" id="userAvatarUrl" value={userAvatarUrl} onChange={(e) => setUserAvatarUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2"
                placeholder="https://example.com/avatar.png" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="userHierarchyLevel" className="block text-sm font-medium text-slate-700">Hierarchy Level</label>
                    <select
                        id="userHierarchyLevel" value={userHierarchyLevel}
                        onChange={(e) => {
                            const newLevel = e.target.value as UserHierarchyLevel;
                            setUserHierarchyLevel(newLevel);
                            if (newLevel === 'Team Head') setUserReportsTo(null); 
                        }}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2.5"
                    >
                        {hierarchyLevels.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="userReportsTo" className="block text-sm font-medium text-slate-700">Reports To (Manager)</label>
                    <select
                        id="userReportsTo" value={userReportsTo || ''}
                        onChange={(e) => setUserReportsTo(e.target.value || null)}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2.5"
                        disabled={userHierarchyLevel === 'Team Head'}
                    >
                        <option value="">-- Select Manager --</option>
                        {potentialManagers.map(manager => (
                            <option key={manager.id} value={manager.id}>{manager.name} ({manager.hierarchyLevel})</option>
                        ))}
                    </select>
                     {userHierarchyLevel === 'Team Head' && <p className="text-xs text-slate-500 mt-1">Team Heads do not report to anyone.</p>}
                </div>
            </div>
             <div>
                <p className="text-sm text-slate-700">Derived Role: <span className="font-semibold capitalize">{mapHierarchyToRole(userHierarchyLevel).replace('-', ' ')}</span></p>
             </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button type="button" onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-sm">
                Cancel
              </button>
              <button type="submit"
                className="px-4 py-2 text-sm font-medium text-black bg-green-600 hover:bg-green-700 rounded-lg shadow-sm flex items-center space-x-2">
                <CheckIcon className="h-5 w-5" />
                <span>{editingUser ? 'Save Changes' : 'Create User'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UserManagementView;