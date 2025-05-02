import { useCallback, useEffect, useState } from 'react';
import { useWebContainerContext } from '@/context/WebContainerContext';
import { FileSystemTree, BufferEncoding, IFSWatcher } from '@webcontainer/api';

export type FileChangeEvent = {
  type: 'change' | 'rename' | 'delete';
  filename: string;
};

export type WatcherInstance = IFSWatcher;

export function useFileSystem() {
  const { webcontainerInstance, isLoading: isWebContainerLoading } = useWebContainerContext();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (webcontainerInstance && !isWebContainerLoading) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [webcontainerInstance, isWebContainerLoading]);

  const mount = useCallback(
    async (files: FileSystemTree, mountPoint?: string) => {
      if (!webcontainerInstance) throw new Error('WebContainer not initialized (useFileSystem:mount)');
      await webcontainerInstance.mount(files, mountPoint ? { mountPoint } : undefined);
    },
    [webcontainerInstance]
  );

  const readFile = useCallback(
    async (path: string, encoding: BufferEncoding = 'utf-8') => {
      if (!webcontainerInstance) throw new Error('WebContainer not initialized (useFileSystem:readFile)');
      return webcontainerInstance.fs.readFile(path, encoding);
    },
    [webcontainerInstance]
  );

  const writeFile = useCallback(
    async (path: string, content: string | Uint8Array) => {
      if (!webcontainerInstance) throw new Error('WebContainer not initialized (useFileSystem:writeFile)');
      await webcontainerInstance.fs.writeFile(path, content);
    },
    [webcontainerInstance]
  );

  const mkdir = useCallback(
    async (path: string, options: { recursive: true } = { recursive: true }) => {
      if (!webcontainerInstance) throw new Error('WebContainer not initialized (useFileSystem:mkdir)');
      await webcontainerInstance.fs.mkdir(path, options);
    },
    [webcontainerInstance]
  );

  const rm = useCallback(
    async (path: string, options?: { recursive?: boolean; force?: boolean }) => {
      if (!webcontainerInstance) throw new Error('WebContainer not initialized (useFileSystem:rm)');
      await webcontainerInstance.fs.rm(path, options);
    },
    [webcontainerInstance]
  );

  const watchDirectory = useCallback(
    (path: string, callback: (event: FileChangeEvent) => void): WatcherInstance => {
      if (!webcontainerInstance) throw new Error('WebContainer not initialized (useFileSystem:watchDirectory)');
      
      return webcontainerInstance.fs.watch(path, { recursive: true }, (event: string, filename: string | Uint8Array) => {
        if (typeof filename === 'string') {
          callback({ type: event as FileChangeEvent['type'], filename });
        }
      });
    },
    [webcontainerInstance]
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