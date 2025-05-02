'use client'; // Mark this as a Client Component

import React, { createContext, useContext, ReactNode } from 'react';
import { WebContainer, FileSystemTree } from '@webcontainer/api'; // Added back FileSystemTree
import { useWebContainer } from '../hooks/useWebContainer';

// Define the shape of the context data
export interface WebContainerContextType {
  webcontainerInstance: WebContainer | null;
  isLoading: boolean;
  isMounted: boolean;
  error: Error | null;
  loadingMessage?: string; // Add optional loading message
  bootAndMountFiles: (finalTree: FileSystemTree) => Promise<void>; // Updated function name back
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

interface WebContainerProviderProps {
  children: ReactNode;
}

export function WebContainerProvider({ children }: WebContainerProviderProps) {
  const webContainerState = useWebContainer();

  const contextValue: WebContainerContextType = {
    webcontainerInstance: webContainerState.webcontainerInstance,
    isLoading: webContainerState.isLoading,
    isMounted: webContainerState.isMounted,
    error: webContainerState.error,
    loadingMessage: webContainerState.loadingMessage,
    bootAndMountFiles: webContainerState.bootAndMountFiles, // Use updated function name back
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