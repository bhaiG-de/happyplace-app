'use client';

import { useState, useEffect, use } from 'react';
import { 
  SandpackProvider, 
  SandpackCodeEditor, 
  SandpackPreview, 
  SandpackFileExplorer,
  // useSandpack, // Removed unused import
  SandpackFiles
} from "@codesandbox/sandpack-react";
// import { githubDark } from "@codesandbox/sandpack-themes"; // Removed theme import
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// import { useAstRegistry } from '@/hooks/useAstRegistry';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
// import { PanelGroup } from "react-resizable-panels"; // Removed direct import
import { fetchRepoDataForSandpack, DetectedSandpackTemplate } from '@/lib/github/repo'; // Import the type too

// Removed buildFileSystemTree and related WebContainer/FileSystem imports

// Simple Editor Wrapper (can be expanded for Monaco)
function InstanceEditor() {
  // const { code, updateCode } = useActiveCode(); // Hooks available if needed
  return <SandpackCodeEditor showLineNumbers showTabs />;
}

// Inner component to access Sandpack context
function SandpackLayoutAndAst({ initialTab }: { initialTab: 'code' | 'design' }) {
  // const { sandpack } = useSandpack(); // Get sandpack state - Not needed if not using AST
  // const { files } = sandpack; // Extract files state - Not needed if not using AST

  // Removed useAstRegistry hook call

  const [tab, setTab] = useState<'code' | 'design'>(initialTab);

  return (
    <div className="flex h-screen flex-col">
      {/* Removed AST Error Display */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-muted/40 p-1">
          <SandpackFileExplorer />
        </aside>
        <main className="flex-1 flex flex-col">
          <Tabs value={tab} onValueChange={v => setTab(v as 'code' | 'design')} className="flex-1 flex flex-col">
            <TabsList className="border-b bg-background px-4 py-2">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="flex-1 overflow-hidden m-0 p-0">
              <InstanceEditor />
            </TabsContent>
            <TabsContent value="design" className="flex-1 flex flex-col p-0 m-0">
              {/* Removed AST Status Message Display */}
              <ResizablePanelGroup direction="horizontal" className="flex-1">
                <ResizablePanel defaultSize={50} className="bg-background">
                  <SandpackPreview showOpenInCodeSandbox={false} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50}>
                  <div className="h-full p-4 border-l flex items-center justify-center text-muted-foreground">
                    {/* Removed AST Status Display */} Design Canvas / Inspector Area
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

// Main Page Component
// Props type needs to reflect that params is a Promise
type InstancePageProps = {
  params: Promise<{ id: string }> 
};

export default function InstancePage(props: InstancePageProps) {
  const params = use(props.params);
  
  const [files, setFiles] = useState<SandpackFiles | null>(null);
  const [template, setTemplate] = useState<DetectedSandpackTemplate>('static');
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);

  // Fetch initial files and template from GitHub
  useEffect(() => {
    setIsLoadingFiles(true);
    setFileError(null);

    // Split the ID using the new separator '___'
    const parts = params.id.split('___');
    let owner: string | undefined;
    let repo: string | undefined;

    if (parts.length === 2) {
      owner = parts[0];
      repo = parts[1];
    } else {
      setFileError("Invalid instance ID format. Could not determine owner/repo from ID.");
      setIsLoadingFiles(false);
      setFiles(null);
      return;
    }

    // Basic validation (can be improved)
    if (!owner || !repo) {
      setFileError("Invalid owner or repo derived from ID.");
      setIsLoadingFiles(false);
      setFiles(null);
      return;
    }

    console.log(`Fetching files for ${owner}/${repo}...`);
    fetchRepoDataForSandpack(owner, repo)
      .then(({ files: fetchedFiles, template: detectedTemplate }) => {
        console.log(`GitHub files fetched successfully. Template: ${detectedTemplate}`);
        setFiles(fetchedFiles);
        setTemplate(detectedTemplate || 'static');
      })
      .catch(err => {
        console.error("Error fetching instance files:", err);
        const message = err instanceof Error ? err.message : String(err);
        setFileError(`Failed to load repository files: ${message}`);
        setFiles(null);
      })
      .finally(() => {
        setIsLoadingFiles(false);
      });
  }, [params.id]);

  // Removed useAstRegistry call from here

  if (isLoadingFiles) {
    return <div className="flex h-screen items-center justify-center">Loading Repository Files...</div>;
  }

  if (fileError) { // Show only file loading error here
    return <div className="flex h-screen items-center justify-center text-red-500">Error: {fileError}</div>;
  }

  if (!files) {
     return <div className="flex h-screen items-center justify-center text-red-500">Error: Could not load files.</div>;
  }
  console.log(files);
  return (
    <SandpackProvider 
      template={template}
      files={files} 
      theme="dark"
      options={{ 
        // bundlerURL: "https://sandpack-bundler.codesandbox.io", // Removing explicit URL
        skipEval: false, // Ensure evaluation happens
        activeFile: "/src/App.tsx" // Set a reasonable default active file
      }}
    >
      {/* Render inner component that uses Sandpack context */}
      <SandpackLayoutAndAst initialTab="code" /> 
    </SandpackProvider>
  );
} 