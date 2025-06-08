import React from 'react';
import { NavLink } from 'react-router-dom';
import { useFeedback } from '../../contexts/FeedbackContext.tsx';
import { ChartPieIcon, DocumentTextIcon, Cog6ToothIcon, UserCircleIcon, UsersIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { UserRole } from '../../types'; 

const Sidebar: React.FC = () => {
  const { currentUser } = useFeedback();

  const commonNavItems = [
    { path: '/', label: 'Dashboard', icon: ChartPieIcon },
    { path: '/my-reports', label: 'My Reports', icon: DocumentTextIcon },
  ];

  const teamReportsItem = { path: '/team-reports', label: 'Team Reports', icon: FolderOpenIcon };
  const adminPanelItem = { path: '/admin', label: 'Admin Panel', icon: Cog6ToothIcon };

  let navItems = [...commonNavItems];
  if (currentUser?.role === 'admin' || currentUser?.role === 'super-admin') {
    navItems.push(teamReportsItem);
    navItems.push(adminPanelItem);
  }


  const activeClassName = "bg-sky-100 text-sky-700 border-l-4 border-sky-600";
  const inactiveClassName = "text-slate-600 hover:bg-slate-200 hover:text-slate-800";
  const linkBaseClassName = "flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors duration-150";

  if (!currentUser) {
    return null; 
  }

  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'super-admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'provider': return 'Provider';
      default: return role;
    }
  };

  return (
    <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-200">
         <div className="flex items-center space-x-3">
            <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover" />
            <div>
                <p className="text-sm font-semibold text-slate-800">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{getRoleDisplayName(currentUser.role)}</p>
            </div>
        </div>
      </div>
      <nav className="flex-grow py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `${linkBaseClassName} ${isActive ? activeClassName : inactiveClassName}`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-200">
        <p className="text-xs text-slate-400 text-center">&copy; {new Date().getFullYear()} FeedbackPortal</p>
      </div>
    </aside>
  );
};

export default Sidebar;