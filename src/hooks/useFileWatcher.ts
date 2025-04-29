import { useCallback, useEffect, useState } from 'react';
import { useFileSystem } from './useFileSystem';

export type FileChangeEvent = {
  type: 'change' | 'rename' | 'delete';
  filename: string;
};

export function useFileWatcher(path: string) {
  const { watchDirectory } = useFileSystem();
  const [events, setEvents] = useState<FileChangeEvent[]>([]);

  useEffect(() => {
    const watcher = watchDirectory(path, (event: FileChangeEvent) => {
      setEvents(prev => [...prev, event]);
    });

    return () => {
      watcher.close();
    };
  }, [path, watchDirectory]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    clearEvents,
  };
} 