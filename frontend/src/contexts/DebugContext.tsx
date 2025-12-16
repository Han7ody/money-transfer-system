'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface DebugLog {
  apiLogs: any[];
  stateTransitions: any[];
  permissionChecks: any[];
  routingParams: any;
  contextData: any;
}

interface DebugContextType {
  debugEnabled: boolean;
  setDebugEnabled: (enabled: boolean) => void;
  debugData: DebugLog;
  addApiLog: (log: any) => void;
  addStateTransition: (transition: any) => void;
  addPermissionCheck: (check: any) => void;
  setRoutingParams: (params: any) => void;
  setContextData: (data: any) => void;
  clearDebugData: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugEnabled, setDebugEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_debug_mode') === 'true';
    }
    return false;
  });

  const [debugData, setDebugData] = useState<DebugLog>({
    apiLogs: [],
    stateTransitions: [],
    permissionChecks: [],
    routingParams: {},
    contextData: {}
  });

  const addApiLog = (log: any) => {
    if (!debugEnabled) return;
    setDebugData(prev => ({
      ...prev,
      apiLogs: [...prev.apiLogs.slice(-49), { ...log, timestamp: new Date().toISOString() }]
    }));
  };

  const addStateTransition = (transition: any) => {
    if (!debugEnabled) return;
    setDebugData(prev => ({
      ...prev,
      stateTransitions: [...prev.stateTransitions.slice(-49), { ...transition, timestamp: new Date().toISOString() }]
    }));
  };

  const addPermissionCheck = (check: any) => {
    if (!debugEnabled) return;
    setDebugData(prev => ({
      ...prev,
      permissionChecks: [...prev.permissionChecks.slice(-49), { ...check, timestamp: new Date().toISOString() }]
    }));
  };

  const setRoutingParams = (params: any) => {
    if (!debugEnabled) return;
    setDebugData(prev => ({ ...prev, routingParams: params }));
  };

  const setContextData = (data: any) => {
    if (!debugEnabled) return;
    setDebugData(prev => ({ ...prev, contextData: data }));
  };

  const clearDebugData = () => {
    setDebugData({
      apiLogs: [],
      stateTransitions: [],
      permissionChecks: [],
      routingParams: {},
      contextData: {}
    });
  };

  const handleSetDebugEnabled = (enabled: boolean) => {
    setDebugEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_debug_mode', enabled.toString());
    }
    if (!enabled) {
      clearDebugData();
    }
  };

  return (
    <DebugContext.Provider
      value={{
        debugEnabled,
        setDebugEnabled: handleSetDebugEnabled,
        debugData,
        addApiLog,
        addStateTransition,
        addPermissionCheck,
        setRoutingParams,
        setContextData,
        clearDebugData
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}
