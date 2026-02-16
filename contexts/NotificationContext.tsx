import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  hideNotification: () => void;
  notification: {
    message: string;
    type: NotificationType;
    isVisible: boolean;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children?: ReactNode }) => {
  const [notification, setNotification] = useState({
    message: '',
    type: 'info' as NotificationType,
    isVisible: false,
  });
  
  const timerRef = useRef<number | null>(null);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isVisible: false }));
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setNotification({ message, type, isVisible: true });
    
    // Auto hide after 5 seconds
    timerRef.current = window.setTimeout(() => {
      setNotification(prev => ({ ...prev, isVisible: false }));
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification, notification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};