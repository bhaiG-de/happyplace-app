import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { useState, useCallback, useRef } from 'react';

let sharedWebcontainerInstance: WebContainer | null = null;

export function useWebContainer() {
  const [instance, setInstance] = useState<WebContainer | null>(sharedWebcontainerInstance);
  const isBootingOrMountingRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing...');

  const bootAndMountFiles = useCallback(async (finalTree: FileSystemTree) => {
    if (isBootingOrMountingRef.current) {
      console.warn("Boot or mount operation already in progress. Skipping.");
      return;
    }
    
    console.log('Starting boot and final tree mount process...');
    isBootingOrMountingRef.current = true;
    setIsLoading(true);
    setError(null);
    setIsMounted(false);
    setLoadingMessage('Booting WebContainer...');

    try {
      let wcInstance = sharedWebcontainerInstance;

      if (!wcInstance) {
        console.log('No shared instance found, booting WebContainer...');
        wcInstance = await WebContainer.boot();
        console.log('WebContainer Booted Successfully!');
        sharedWebcontainerInstance = wcInstance;
        setInstance(wcInstance);
      } else {
         console.log('Using existing shared WebContainer instance.');
         if (!instance) setInstance(wcInstance); 
      }
      
      setLoadingMessage('Mounting complete filesystem tree...');
      console.log('Mounting final sandbox tree structure at root (/)...');
      
      await wcInstance.mount(finalTree, { mountPoint: '/' }); 
      
      console.log('Final sandbox filesystem tree mounted successfully!');
      setIsMounted(true);
      setLoadingMessage('Mount complete.');

      try {
          const verifyPath = '/sandbox/user-project/package.json';
          console.log(`Verifying mount by checking for ${verifyPath}...`);
          await wcInstance.fs.readFile(verifyPath);
          console.log(`Mount verification successful (${verifyPath} exists).`);
      } catch (verificationError) {
           console.warn(`Mount verification failed: Could not read user project package.json.`, verificationError);
      }

    } catch (err: unknown) {
      console.error('Error during boot or mount process:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to boot WebContainer or mount filesystem';
      setError(new Error(errorMessage));
      setIsMounted(false);
      setLoadingMessage(`Error: ${errorMessage}`);
    } finally {
      console.log('Boot and final tree mount process finished.');
      isBootingOrMountingRef.current = false;
      setIsLoading(false); 
    }
  }, [instance]);

  return {
    webcontainerInstance: instance,
    isLoading,
    loadingMessage,
    isMounted,
    error,
    bootAndMountFiles,
  };
} 