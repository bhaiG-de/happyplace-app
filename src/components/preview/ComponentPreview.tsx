'use client';

import React, { useState, useEffect, useRef } from 'react';
// Adjust import path if necessary, assuming context is one level up
import { useAstRegistry } from '@/context/AstRegistryContext';
// import { Skeleton } from '@/components/ui/skeleton'; // Removed - component not yet added

// REMOVED: selectedFilePath from props
// type ComponentPreviewProps = {
//   selectedFilePath: string | null; // Path of the file selected in the editor/tree
// };

// Remove React.FC type as props are empty
export const ComponentPreview = () => {
  // Get relevant context values
  const { previewUrl, isPreviewServerRunning, isPreviewAppSetup, isLoading: isAstLoading } = useAstRegistry();
  // Keep iframeKey but remove setIframeKey for now
  const [iframeKey] = useState<number>(Date.now());
  // Combined loading state based on context
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('Initializing preview environment...');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Effect to manage loading/message state based on context
  useEffect(() => {
    if (!isAstLoading && isPreviewAppSetup && isPreviewServerRunning && previewUrl) {
      setIsLoading(false);
      setMessage(''); // Ready
    } else if (!isAstLoading && isPreviewAppSetup && isPreviewServerRunning && !previewUrl) {
      setIsLoading(true);
      setMessage('Starting preview server...');
    } else if (!isAstLoading && !isPreviewAppSetup) {
      setIsLoading(true);
      setMessage('Setting up preview environment...');
    } else if (isAstLoading) {
      setIsLoading(true);
      setMessage('Parsing project files...');
    } else {
      setIsLoading(true);
      setMessage('Waiting for container...');
    }
  }, [isAstLoading, isPreviewAppSetup, isPreviewServerRunning, previewUrl]);

  // REMOVED: useEffect that called updatePreviewWrapper

  // REMOVED P4-06: Listener for component map updates
  // (The useEffect listening to window messages is removed)

  // Called when the iframe successfully loads its content
  const handleLoad = () => {
    console.log('ComponentPreview: iframe finished loading content.');
    // Don't necessarily set isLoading false here, rely on context effect
    // setMessage(''); // Clear message? Might conflict with context effect
  };

  // Called if the iframe fails to load (network error, etc.)
  const handleError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error('ComponentPreview: iframe failed to load:', e);
    // Use a more specific error message if possible
    setMessage(`Failed to load preview iframe (${previewUrl || 'No URL'}). Check console.`);
    setIsLoading(true); // Indicate error/loading state
  };

  // Determine if we should attempt to show the iframe
  const showIframe = isPreviewServerRunning && previewUrl;

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 relative overflow-hidden"> {/* Added overflow-hidden */}
      {/* Overlay for Loading/Messages - Show if loading OR if iframe shouldn't be shown */} 
      {(isLoading || !showIframe) && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 bg-opacity-90 text-white z-10 p-4">
          <p className="text-muted-foreground text-center">
             {message || (isLoading ? 'Loading...' : 'Initializing...')}
          </p>
        </div>
      )}

      {/* Iframe Container - Render iframe only when server is ready and URL exists */} 
      {showIframe && (
        <iframe
          key={iframeKey} // Use key to force remount on change if needed
          ref={iframeRef}
          src={previewUrl} // Use previewUrl directly
          title="Component Preview"
          // Apply opacity transition for smoother loading appearance
          className={`w-full h-full border-0 flex-1 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}; 