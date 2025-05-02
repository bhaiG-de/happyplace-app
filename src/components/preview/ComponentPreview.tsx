'use client';

import React, { useState, useRef } from 'react';

// Define the expected status type (can be imported if shared)
type PreviewStatus = 'IDLE' | 'INITIALIZING_PARSER' | 'PARSING' | 'READY' | 'ERROR' | 'STARTING_SERVER' | 'SERVER_READY' | 'UNKNOWN'; // Add relevant statuses

// Define props for the component
type ComponentPreviewProps = {
  status: PreviewStatus;
  statusMessage: string;
  devServerUrl: string | null; // URL can be null initially
};

export const ComponentPreview: React.FC<ComponentPreviewProps> = ({ 
  status, 
  statusMessage, 
  devServerUrl 
}) => {
  const [iframeKey] = useState<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Derive loading state from the passed status prop
  // Define what statuses mean "loading"
  const isLoading = !['READY', 'SERVER_READY', 'ERROR'].includes(status);

  // Called when the iframe successfully loads its content
  const handleLoad = () => {
    console.log('ComponentPreview: iframe finished loading content.');
  };

  // Called if the iframe fails to load (network error, etc.)
  const handleError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error('ComponentPreview: iframe failed to load:', e);
    // Display the error status message passed via props
  };

  // Show iframe only when the server is ready AND we have its URL
  // Adjust the status check based on your actual "ready" state name
  const showIframe = (status === 'READY' || status === 'SERVER_READY') && devServerUrl;

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 relative overflow-hidden">
      {/* Overlay: Show if loading OR if in ERROR state */}
      {(isLoading || status === 'ERROR') && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 bg-opacity-90 text-white z-10 p-4">
          <p className="text-muted-foreground text-center whitespace-pre-wrap">
            {/* Display statusMessage directly from props */} 
            {statusMessage}
          </p>
        </div>
      )}

      {/* Iframe: Render ONLY when status indicates ready and URL exists */}
      {showIframe && (
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={devServerUrl} // Use devServerUrl from props
          title="Component Preview"
          className={`w-full h-full border-0 flex-1 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}; 