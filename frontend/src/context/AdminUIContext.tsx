'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AdminUIContextType {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  toggleSidebar: () => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  toggleNotifications: () => void;
}

const AdminUIContext = createContext<AdminUIContextType | undefined>(undefined);

export function AdminUIProvider({ children }: { children: ReactNode }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleSidebar = () => setShowSidebar(prev => !prev);
  const toggleNotifications = () => setShowNotifications(prev => !prev);

  return (
    <AdminUIContext.Provider
      value={{
        showSidebar,
        setShowSidebar,
        toggleSidebar,
        showNotifications,
        setShowNotifications,
        toggleNotifications,
      }}
    >
      {children}
    </AdminUIContext.Provider>
  );
}

export function useAdminUI() {
  const context = useContext(AdminUIContext);
  if (context === undefined) {
    throw new Error('useAdminUI must be used within an AdminUIProvider');
  }
  return context;
}
