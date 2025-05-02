'use client';

// import { WebContainerProvider } from '@/context/WebContainerContext'; // Removed unused provider
import { CodeEditor } from '@/components/code/Editor';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useWebContainerContext } from '@/context/WebContainerContext';
import { useState, useEffect, useCallback } from 'react';
import { FileTree, FileSystemTree} from '@/components/core/FileTree'; // Removed unused isFileNode import
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ComponentPreview } from '@/components/preview/ComponentPreview';
import { FileSystemAPI, DirEnt } from '@webcontainer/api';
import type { editor } from 'monaco-editor'; // Import the monaco editor type
import { useAstRegistry } from '@/hooks/useAstRegistry'; // Import AST hook
import { ResizablePanel } from '@/components/ui/resizable-panel';
import { PanelGroup } from "react-resizable-panels"; // Import PanelGroup directly

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

export default function InstancePage() {
  const { isMounted: isContainerBooted, webcontainerInstance } = useWebContainerContext();
  const { readFile, isReady: isFileSystemReady } = useFileSystem();
  const { isPreviewAppSetup, previewUrl, error: astError, isLoading: isAstLoading } = useAstRegistry();
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('// Select a file to view its content');
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [tab, setTab] = useState<'code' | 'design'>('code');
  const [fsTree, setFsTree] = useState<FileSystemTree>({});
  const [fileError, setFileError] = useState<string | null>(null);

  // Fetch the file system tree from WebContainer (user project is now at /sandbox/user-project)
  useEffect(() => {
    async function fetchTree() {
      if (webcontainerInstance && isFileSystemReady) {
        try {
          console.log("Fetching file tree from /sandbox/user-project (Instance ready)...");
          const tree = await buildFileSystemTree(webcontainerInstance.fs, '/sandbox/user-project'); // Updated path
          setFsTree(tree);
          console.log("File tree fetched successfully");
        } catch (err) {
          console.error("Error fetching file tree:", err);
          setFileError("Failed to load file structure.");
          setFsTree({});
        }
      } else {
        console.log(`Skipping fetchTree: webcontainerInstance=${!!webcontainerInstance}, isFileSystemReady=${isFileSystemReady}`);
      }
    }
    fetchTree();
  }, [webcontainerInstance, isFileSystemReady]);

  const handleFileSelect = useCallback(async (path: string) => {
    console.log(`File selected: ${path}`);
    setSelectedFilePath(path);
    if (path && webcontainerInstance && isFileSystemReady) {
      setIsLoadingFile(true);
      setEditorContent('// Loading file...');
      setFileError(null);
      try {
        console.log(`Reading file: ${path}`);
        // Ensure readFile hook uses the correct instance provided by context
        const content = await readFile(path); 
        console.log(`File read successful, content type: ${typeof content}`);
        setEditorContent(content);
      } catch (err: unknown) {
        console.error(`Error reading file ${path}:`, err);
        // Type check for error message
        const errorMessage = err instanceof Error ? err.message : String(err);
        setEditorContent(`// Error loading file: ${errorMessage}`);
        setFileError(`Failed to read file: ${errorMessage}`);
      } finally {
        setIsLoadingFile(false);
      }
    } else if (!path) {
        setSelectedFilePath(null);
        setEditorContent('// No file selected');
    } else {
        console.warn('Cannot read file: WebContainer or file system not ready.');
        setEditorContent('// WebContainer not ready');
    }
  }, [webcontainerInstance, isFileSystemReady, readFile]);

  // Load initial file content when selectedFilePath changes
  useEffect(() => {
    if (selectedFilePath) {
      handleFileSelect(selectedFilePath);
    }
  }, [selectedFilePath, handleFileSelect]); // Depend on handleFileSelect ensures it has latest context

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
      {(fileError || astError) && (
        <div className="bg-red-500 text-white p-2 text-sm z-20 relative">
          Error: {fileError || (astError?.message ?? 'Unknown error')}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {/* FileTree Navigation */}
        <aside className="w-64 border-r bg-muted p-2 overflow-y-auto">
          <FileTree
            tree={fsTree}
            selectedPath={selectedFilePath}
            onSelect={handleFileSelect}
            basePath="/sandbox/user-project" // Update base path to the correct user project root
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
                options={{ readOnly: !isContainerBooted || !selectedFilePath || isLoadingFile }}
                theme="vs-dark"
              />
            </TabsContent>
            <TabsContent value="design" className="flex-1 flex flex-col p-0 m-0">
                <div className="p-2 border-b bg-background flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                        { !isContainerBooted ? 'Booting Container...' :
                          isAstLoading ? 'Parsing Files...' :
                          !isPreviewAppSetup ? 'Setting up preview environment...' :
                          !previewUrl ? 'Starting preview server...' :
                          'Preview server running.' }
                    </span>
                    {previewUrl && (
                         <span className="text-xs text-muted-foreground">Previewing at: <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="underline">{previewUrl}</a></span>
                     )}
                </div>
               <PanelGroup direction="horizontal" className="flex-1">
                 <ResizablePanel defaultSize={50}>
                   <div className="h-full p-4 bg-background">
                     <ComponentPreview />
                   </div>
                 </ResizablePanel>
               </PanelGroup>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
} 