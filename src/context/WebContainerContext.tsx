'use client'; // Mark this as a Client Component

import { createContext, useContext, ReactNode } from 'react';
import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { useWebContainer } from '../hooks/useWebContainer';

interface WebContainerContextType {
  webcontainerInstance: WebContainer | null;
  isBooting: boolean;
  isMounted: boolean;
  error: Error | null;
  setFilesToMount: (files: FileSystemTree | null) => void;
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

interface WebContainerProviderProps {
  children: ReactNode;
}

export function WebContainerProvider({ children }: WebContainerProviderProps) {
  const webContainerState = useWebContainer();

  const contextValue: WebContainerContextType = {
    webcontainerInstance: webContainerState.webcontainerInstance,
    isBooting: webContainerState.isBooting,
    isMounted: webContainerState.isMounted,
    error: webContainerState.error,
    setFilesToMount: webContainerState.setFilesToMount,
  };

  return (
    <WebContainerContext.Provider value={contextValue}>
      {children}
    </WebContainerContext.Provider>
  );
}

export function useWebContainerContext() {
  const context = useContext(WebContainerContext);
  if (!context) {
    throw new Error('useWebContainerContext must be used within a WebContainerProvider');
  }
  return context;
} 