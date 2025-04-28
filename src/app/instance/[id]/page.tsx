'use client';

// import { WebContainerProvider } from '@/context/WebContainerContext'; // Removed unused provider
import { CodeEditor } from '@/components/code/Editor';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useWebContainerContext } from '@/context/WebContainerContext';
import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export default function InstancePage() {
  const { isMounted } = useWebContainerContext();
  const { readFile, writeFile } = useFileSystem();
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('// Select a file to view its content');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isMounted && !selectedFilePath) {
      setSelectedFilePath('/project/src/main.tsx');
    }
  }, [isMounted, selectedFilePath]);

  useEffect(() => {
    if (selectedFilePath && isMounted) {
      setIsLoading(true);
      console.log(`Reading file: ${selectedFilePath}`);
      readFile(selectedFilePath)
        .then((content: string | Uint8Array) => {
          console.log(`Read content for ${selectedFilePath}:`, typeof content);
          if (typeof content === 'string') {
             setEditorContent(content);
          } else if (content instanceof Uint8Array) {
             const decoder = new TextDecoder();
             setEditorContent(decoder.decode(content));
             console.warn(`File ${selectedFilePath} was read as Uint8Array and decoded.`);
          } else {
             setEditorContent(`// Unable to display content of type ${typeof content}`);
             console.error(`File ${selectedFilePath} has unexpected content type.`);
          }
        })
        .catch((error) => {
          console.error(`Error reading file ${selectedFilePath}:`, error);
          if (error.code === 'ENOENT') {
              setEditorContent(`// Error: File not found at ${selectedFilePath}`);
          } else {
              setEditorContent(`// Error loading file: ${error.message}`);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isMounted && selectedFilePath) {
       setEditorContent('// Waiting for file system mount...');
    } else {
      setEditorContent('// Select a file or wait for file system...');
    }
  }, [selectedFilePath, isMounted, readFile]);

  const debouncedSave = useDebouncedCallback(
    async (path: string, content: string) => {
      if (!isMounted) return;
      console.log(`Saving file: ${path}`);
      try {
        await writeFile(path, content);
        console.log(`File saved: ${path}`);
      } catch (error) {
        console.error(`Error writing file ${path}:`, error);
      }
    },
    1000
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        setEditorContent(value);
        if (selectedFilePath && isMounted) {
          debouncedSave(selectedFilePath, value);
        }
      }
    },
    [selectedFilePath, isMounted, debouncedSave]
  );

  const getLanguageFromPath = (path: string | null): string => {
    if (!path) return 'plaintext';
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'md':
        return 'markdown';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-2 border-b">Status: {isMounted ? 'Mounted' : 'Mounting...'} | Selected: {selectedFilePath || 'None'} {isLoading ? '(Loading...)' : ''}</div>
      <div className="flex-1 overflow-hidden">
        <CodeEditor
          height="100%"
          language={getLanguageFromPath(selectedFilePath)}
          path={selectedFilePath || 'untitled'}
          value={editorContent}
          onChange={handleEditorChange}
          options={{ readOnly: !isMounted || !selectedFilePath || isLoading }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
} 