'use client';

// import { WebContainerProvider } from '@/context/WebContainerContext'; // Removed unused provider
import { CodeEditor } from '@/components/code/Editor';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useWebContainerContext } from '@/context/WebContainerContext';
import { useState, useEffect, useCallback } from 'react';
import { FileTree, FileSystemTree, FileNode, DirectoryNode, SymlinkNode } from '@/components/core/FileTree';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileSystemAPI, DirEnt } from '@webcontainer/api';
import type { editor } from 'monaco-editor'; // Import the monaco editor type

async function buildFileSystemTree(fs: FileSystemAPI, path: string): Promise<FileSystemTree> {
  const entries = await fs.readdir(path, { withFileTypes: true });
  const tree: FileSystemTree = {};
  for (const entry of entries) {
    const entryPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
    if (entry.isDirectory()) {
      tree[entry.name] = {
        directory: await buildFileSystemTree(fs, entryPath),
      };
    } else if (entry.isFile()) {
      tree[entry.name] = {
        file: { contents: '' }, // contents not loaded here
      };
    } else if ('isSymbolicLink' in entry && entry.isSymbolicLink && (entry as DirEnt<string> & { isSymbolicLink: () => boolean }).isSymbolicLink()) {
      tree[entry.name] = {
        symlink: entryPath,
      };
    }
  }
  return tree;
}

// Helper to check if a path points to a file in the FileSystemTree
function isFileNode(tree: FileSystemTree, path: string): boolean {
  const parts = path.replace(/^\/project\//, '').split('/');
  let currentNode: FileSystemTree | FileNode | DirectoryNode | SymlinkNode | undefined = tree;

  for (const part of parts) {
    if (!currentNode || typeof currentNode !== 'object' || Array.isArray(currentNode)) {
      return false; // Invalid path or structure
    }

    if ('directory' in currentNode) {
      currentNode = (currentNode as DirectoryNode).directory[part];
    } else if (typeof currentNode === 'object' && part in currentNode) {
       // We are at the root level or traversing
      currentNode = (currentNode as FileSystemTree)[part];
    } else {
      return false; // Part not found
    }
  }

  return !!currentNode && 'file' in currentNode;
}

export default function InstancePage() {
  const { isMounted, webcontainerInstance } = useWebContainerContext();
  const { readFile, isReady } = useFileSystem();
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('// Select a file to view its content');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tab, setTab] = useState<'code' | 'design'>('code');
  const [fsTree, setFsTree] = useState<FileSystemTree>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch the file system tree from WebContainer (/project is the root)
  useEffect(() => {
    async function fetchTree() {
      if (isReady && isMounted && webcontainerInstance) {
        try {
          console.log("Fetching file tree...");
          const tree = await buildFileSystemTree(webcontainerInstance.fs, '/project');
          setFsTree(tree);
          console.log("File tree fetched successfully");
        } catch (err) {
          console.error("Error fetching file tree:", err);
          setError("Failed to load file structure.");
          setFsTree({});
        }
      }
    }
    fetchTree();
  }, [isReady, isMounted, webcontainerInstance]);

  useEffect(() => {
    if (isMounted && !selectedFilePath) {
      // Default to main.tsx
      setSelectedFilePath('/project/src/main.tsx');
    }
  }, [isMounted, selectedFilePath]);

  useEffect(() => {
    if (selectedFilePath && isMounted) {
      // Check if the selected path is a file before attempting to read
      if (!isFileNode(fsTree, selectedFilePath)) {
        setEditorContent('// Select a file to view its content');
        setIsLoading(false); // Not loading if it's a directory
        setError(null); // Clear previous errors
        return;
      }

      setIsLoading(true);
      setError(null);
      console.log(`Reading file: ${selectedFilePath}`);
      
      readFile(selectedFilePath)
        .then((content: string | Uint8Array) => {
          console.log(`File read successful, content type: ${typeof content}`);
          if (typeof content === 'string') {
            setEditorContent(content);
          } else if (content instanceof Uint8Array) {
            const decoder = new TextDecoder();
            setEditorContent(decoder.decode(content));
          } else {
            setEditorContent('// Unable to display content');
          }
        })
        .catch((error) => {
          console.error(`Error reading file ${selectedFilePath}:`, error);
          setError(error.message || String(error));
          setEditorContent(`// Error: ${error.message || String(error)}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!selectedFilePath) {
      setEditorContent('// Select a file to view its content');
    }
  }, [selectedFilePath, isMounted, readFile, fsTree]);

  const handleFileSelect = useCallback((path: string) => {
    console.log(`File selected: ${path}`);
    setSelectedFilePath(path);
    setTab('code');
  }, []);

  // Type for Monaco Editor's onChange handler
  type MonacoOnChange = (value: string | undefined, ev: editor.IModelContentChangedEvent) => void;

  const handleEditorChange: MonacoOnChange = useCallback((value) => {
    if (value !== undefined) {
      setEditorContent(value);
      // Add debounced saving logic here if needed
    }
  }, []);

  // Extract filename from path for display purposes
  const filename = selectedFilePath ? selectedFilePath.split('/').pop() : 'untitled';
  
  return (
    <div className="flex h-screen flex-col">
      {error && (
        <div className="bg-red-500 text-white p-2 text-sm">
          Error: {error}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {/* FileTree Navigation */}
        <aside className="w-64 border-r bg-muted p-2 overflow-y-auto">
          <FileTree
            tree={fsTree}
            selectedPath={selectedFilePath}
            onSelect={handleFileSelect}
            basePath="/project" // Set base path to match readFile logic
          />
        </aside>
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <Tabs value={tab} onValueChange={v => setTab(v as 'code' | 'design')} className="flex-1 flex flex-col">
            <TabsList className="border-b bg-background px-4 py-2">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="flex-1 overflow-hidden">
              <CodeEditor
                height="100%"
                language={selectedFilePath?.split('.').pop() === 'tsx' ? 'typescript' : 'plaintext'}
                path={filename} // Use just the filename for model identification
                value={editorContent}
                onChange={handleEditorChange}
                options={{ readOnly: !isMounted || !selectedFilePath || isLoading }}
                theme="vs-dark"
              />
            </TabsContent>
            <TabsContent value="design" className="flex-1 flex items-center justify-center">
              <div className="text-muted-foreground">Design Canvas Preview (coming soon)</div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
} 