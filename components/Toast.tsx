import React, { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { notification, hideNotification } = useNotification();

  // Close on any user action (click or keydown)
  useEffect(() => {
    if (notification.isVisible) {
      const handleUserAction = () => {
        hideNotification();
      };

      // Add delay to prevent immediate closing from the triggering click (e.g., submit button)
      const timer = setTimeout(() => {
        window.addEventListener('click', handleUserAction);
        window.addEventListener('keydown', handleUserAction);
      }, 100);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('click', handleUserAction);
        window.removeEventListener('keydown', handleUserAction);
      };
    }
  }, [notification.isVisible, hideNotification]);

  if (!notification.isVisible) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const borderColors = {
    success: 'border-green-500',
    error: 'border-red-500',
    info: 'border-blue-500'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start p-4 bg-white rounded-lg shadow-xl border-l-4 ${borderColors[notification.type]} max-w-sm w-full animate-slide-in-down`}>
      <div className="flex-shrink-0 mr-3 mt-0.5">
        {icons[notification.type]}
      </div>
      <div className="flex-1 mr-2">
        <h4 className="text-sm font-semibold text-slate-900 capitalize mb-1">{notification.type}</h4>
        <p className="text-sm text-slate-600 leading-relaxed">{notification.message}</p>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent bubbling to window listener
          hideNotification();
        }} 
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};