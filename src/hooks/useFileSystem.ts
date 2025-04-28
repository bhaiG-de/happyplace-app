import { useCallback, useEffect, useState } from 'react';
import { useWebContainer } from './useWebContainer';
import { FileSystemTree, BufferEncoding } from '@webcontainer/api';

export type FileChangeEvent = {
  type: 'change' | 'rename' | 'delete';
  filename: string;
};

export function useFileSystem() {
  const { webcontainerInstance: webcontainer } = useWebContainer();
  const [isReady, setIsReady] = useState(false);

  // Initialize file system
  useEffect(() => {
    if (webcontainer) {
      setIsReady(true);
    }
  }, [webcontainer]);

  // Mount files to the container
  const mount = useCallback(
    async (files: FileSystemTree, mountPoint?: string) => {
      if (!webcontainer) throw new Error('WebContainer not initialized');
      await webcontainer.mount(files, mountPoint ? { mountPoint } : undefined);
    },
    [webcontainer]
  );

  // Read file contents
  const readFile = useCallback(
    async (path: string, encoding: BufferEncoding = 'utf-8') => {
      if (!webcontainer) throw new Error('WebContainer not initialized');
      return webcontainer.fs.readFile(path, encoding);
    },
    [webcontainer]
  );

  // Write file contents
  const writeFile = useCallback(
    async (path: string, content: string | Uint8Array) => {
      if (!webcontainer) throw new Error('WebContainer not initialized');
      await webcontainer.fs.writeFile(path, content);
    },
    [webcontainer]
  );

  // Create directory
  const mkdir = useCallback(
    async (path: string, options: { recursive: true } = { recursive: true }) => {
      if (!webcontainer) throw new Error('WebContainer not initialized');
      await webcontainer.fs.mkdir(path, options);
    },
    [webcontainer]
  );

  // Remove file or directory
  const rm = useCallback(
    async (path: string, options?: { recursive?: boolean; force?: boolean }) => {
      if (!webcontainer) throw new Error('WebContainer not initialized');
      await webcontainer.fs.rm(path, options);
    },
    [webcontainer]
  );

  // Watch directory for changes
  const watchDirectory = useCallback(
    (path: string, callback: (event: FileChangeEvent) => void) => {
      if (!webcontainer) throw new Error('WebContainer not initialized');
      return webcontainer.fs.watch(path, { recursive: true }, (event: string, filename: string | Uint8Array) => {
        if (typeof filename === 'string') {
          callback({ type: event as FileChangeEvent['type'], filename });
        }
      });
    },
    [webcontainer]
  );

  return {
    isReady,
    mount,
    readFile,
    writeFile,
    mkdir,
    rm,
    watchDirectory,
  };
} 