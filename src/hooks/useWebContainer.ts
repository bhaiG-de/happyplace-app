import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { useState, useEffect, useCallback } from 'react';

let sharedWebcontainerInstance: WebContainer | null = null;

export function useWebContainer() {
  const [instance, setInstance] = useState<WebContainer | null>(sharedWebcontainerInstance);
  const [isBooting, setIsBooting] = useState(!sharedWebcontainerInstance);
  const [error, setError] = useState<Error | null>(null);
  const [filesToMount, setFilesToMountState] = useState<FileSystemTree | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const setFilesToMount = useCallback((files: FileSystemTree | null) => {
    console.log('Setting files to mount:', files ? Object.keys(files).length : 0, 'items');
    setIsMounted(false);
    setFilesToMountState(files);
  }, []);

  useEffect(() => {
    if (sharedWebcontainerInstance) {
      if (!instance) setInstance(sharedWebcontainerInstance);
      if (isBooting) setIsBooting(false);
    } else if (!isBooting) {
      setIsBooting(true);
    }

    if (isBooting && !instance) {
      console.log('Booting WebContainer...');
      WebContainer.boot()
        .then((wc) => {
          console.log('WebContainer Booted!');
          sharedWebcontainerInstance = wc;
          setInstance(wc);
          setIsBooting(false);
        })
        .catch((err) => {
          console.error('WebContainer Boot Error:', err);
          setError(err instanceof Error ? err : new Error('Failed to boot WebContainer'));
          setIsBooting(false);
        });
    }

  }, [isBooting, instance]);

  useEffect(() => {
    if (instance && filesToMount && !isBooting && !isMounted) {
      console.log('Ensuring /project directory exists...');
      instance.fs.mkdir('/project', { recursive: true })
        .then(() => {
          console.log('Mounting files into /project...');
          return instance.mount(filesToMount, { mountPoint: '/project' });
        })
        .then(() => {
          console.log('Files mounted successfully! Setting isMounted=true.');
          setIsMounted(true);
          setFilesToMountState(null); 
          console.log('Verifying mounted contents...');
          return Promise.all([
              instance.fs.readdir('/project', { withFileTypes: true }).catch(e => { console.error('Error reading /project:', e); return []; }),
              instance.fs.readdir('/project/src', { withFileTypes: true }).catch(e => { console.error('Error reading /project/src:', e); return []; })
          ]);
        })
        .then(([projectContents, srcContents]) => {
            console.log('Contents of /project:', projectContents.map(item => item.name));
            console.log('Contents of /project/src:', srcContents.map(item => item.name));
        })
        .catch((err) => {
          console.error('Error during mkdir, mount, or readdir:', err);
          setError(err instanceof Error ? err : new Error('Failed to create directory, mount files, or read dir'));
          setIsMounted(false);
        });
    }
  }, [instance, filesToMount, isBooting, isMounted]);

  return {
    webcontainerInstance: instance,
    isBooting,
    isMounted,
    error,
    setFilesToMount,
  };
} 