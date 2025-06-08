import React, { ReactNode, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'; 
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => { 
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; 
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm', 
    md: 'max-w-md', 
    lg: 'max-w-lg', 
    xl: 'max-w-xl', 
    '2xl': 'max-w-2xl', 
    '3xl': 'max-w-3xl', 
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-800 bg-opacity-75 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} 
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} flex flex-col transform transition-all duration-300 ease-out opacity-0 animate-modalOpen`}
        style={{ maxHeight: '90vh' }} 
        onClick={(e) => e.stopPropagation()} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center p-5 border-b border-slate-200 shrink-0">
          <h2 id="modal-title" className="text-xl font-semibold text-slate-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto grow"> 
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;