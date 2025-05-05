'use client';

import { useState, useEffect, use, useRef, forwardRef, useMemo } from 'react';
import { 
  SandpackProvider, 
  SandpackCodeEditor, 
  SandpackPreview, 
  SandpackFileExplorer,
  SandpackFiles,
} from "@codesandbox/sandpack-react";
// import { githubDark } from "@codesandbox/sandpack-themes"; // Removed theme import
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAstRegistry } from '@/hooks/useAstRegistry';
import { fetchRepoDataForSandpack, DetectedSandpackTemplate } from '@/lib/github/repo'; // Import the type too
import type { Node } from '@babel/types'; // Removed unused File import
import { Inspector } from '@/components/design/Inspector'; // Import Inspector
import { Button } from '@/components/ui/button'; // Import Button
import { Pencil } from 'lucide-react'; // Import Pencil icon
import type { UidToAstNodeMap } from '@/lib/ast/instrumentation'; // Import map type
import type { ParsingStatus } from '@/hooks/useAstRegistry'; // Import status type

// Removed buildFileSystemTree and related WebContainer/FileSystem imports

// Simple Editor Wrapper (can be expanded for Monaco)
function InstanceEditor() {
  // const { code, updateCode } = useActiveCode(); // Hooks available if needed
  return <SandpackCodeEditor showLineNumbers showTabs />;
}

// --- Wrapper for SandpackPreview to get iframe ref --- 
// Although SandpackPreview doesn't directly accept a ref for the iframe itself,
// we can wrap it and try to find the iframe within the rendered output.
// A more robust solution might involve Sandpack's internal client APIs if documented.
const SandpackPreviewWrapper = forwardRef<HTMLDivElement, React.ComponentProps<typeof SandpackPreview>>((props, ref) => { 
  return (
    <div ref={ref} className="h-full w-full">
        <SandpackPreview {...props} />
    </div>
  );
});
SandpackPreviewWrapper.displayName = 'SandpackPreviewWrapper';

// --- SandpackLayoutAndAst Component --- 
// Define props it will receive
interface SandpackLayoutAndAstProps {
  initialTab: 'code' | 'design';
  uidToAstNodeMap: UidToAstNodeMap;
  parsingStatus: ParsingStatus;
  astError: Error | null;
}

// Updated function signature to accept props
function SandpackLayoutAndAst({ 
  initialTab, 
  uidToAstNodeMap, 
  parsingStatus, 
  astError 
}: SandpackLayoutAndAstProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [tab, setTab] = useState<'code' | 'design'>(initialTab);
  const [isDesignModeActive, setIsDesignModeActive] = useState<boolean>(false);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  // Effect for postMessage listener - uses uidToAstNodeMap from props
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('[Host] handleMessage triggered. Event Origin:', event.origin, 'Event Data:', event.data);

      if (isDesignModeActive && event.data && event.data.type === 'happyplace-select-uid' && typeof event.data.uid === 'string') {
        const receivedUid = event.data.uid;
        console.log(`[Host] Received UID from preview: ${receivedUid}`);
        // Map UID to AST Node using the map passed via props
        const node = uidToAstNodeMap.get(receivedUid);
        if (node) {
          console.log(`[Host] Mapped UID ${receivedUid} to AST Node:`, node);
          setSelectedNode(node);
        } else {
          // Log the map keys if node not found for debugging
          console.warn(`[Host] Could not find AST Node for UID: ${receivedUid}`);
          console.log("[Host] Available UIDs in map:", Array.from(uidToAstNodeMap.keys()));
          setSelectedNode(null);
        }
      } else {
          if(event.data?.type !== 'happyplace-set-design-mode') {
             console.log('[Host] Received message ignored (mode active?:', isDesignModeActive, ', type match?:', event.data?.type === 'happyplace-select-uid', '):', event.data);
          }
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('[Host] Added message listener.');

    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('[Host] Removed message listener.');
    };
  }, [uidToAstNodeMap, isDesignModeActive]); 

  // --- Effect to Send Mode Status (Host -> Preview using postMessage) --- 
  useEffect(() => {
    // Find the iframe within the wrapper
    const iframe = previewWrapperRef.current?.querySelector('iframe');

    if (iframe && iframe.contentWindow) {
      console.log(`[Host] Sending design mode status via postMessage: ${isDesignModeActive}`);
      iframe.contentWindow.postMessage(
        { 
          type: 'happyplace-set-design-mode', // Custom message type
          active: isDesignModeActive 
        }, 
        '*' // In production, specify the Sandpack preview origin if possible
      );
    } else {
      // Wait for iframe to potentially load
      const timeoutId = setTimeout(() => {
         const iframeRetry = previewWrapperRef.current?.querySelector('iframe');
         if (iframeRetry && iframeRetry.contentWindow) {
            console.log(`[Host] Sending design mode status via postMessage (retry): ${isDesignModeActive}`);
            iframeRetry.contentWindow.postMessage({ type: 'happyplace-set-design-mode', active: isDesignModeActive }, '*');
         } else {
            console.warn("[Host] Iframe not found or contentWindow not accessible to send design mode status.");
         }
      }, 500); // Retry after a short delay
      return () => clearTimeout(timeoutId);
    }
  }, [isDesignModeActive]); // Only trigger when mode changes

  const handleDesignModeToggle = () => {
    setIsDesignModeActive(!isDesignModeActive);
    if (isDesignModeActive) { // If turning *off* design mode
      setSelectedNode(null); // Clear selection when exiting design mode
      // Remove: setSelectedNodeUid(null);
    }
    console.log(`[Host] Design Mode Toggled: ${!isDesignModeActive}`);
  };

  return (
    <div className="flex h-screen flex-col relative">
      {(parsingStatus === 'parsing' || parsingStatus === 'error') && (
        <div 
          className={`p-1 text-xs text-center ${ 
            parsingStatus === 'error' ? 'bg-red-800 text-white' : 'bg-yellow-600 text-black'
          }`}
        >
          {parsingStatus === 'parsing' && 'Processing AST...'}
          {parsingStatus === 'error' && `AST Error: ${astError?.message || 'Unknown error'}`}
        </div>
      )}

      {/* Design Mode Toggle Button */}
      {tab === 'design' && (
         <Button 
           variant="outline" 
           size="icon" 
           className={`absolute top-2 right-2 z-20 ${isDesignModeActive ? 'bg-blue-100 dark:bg-blue-900' : ''}`} 
           onClick={handleDesignModeToggle}
           title={isDesignModeActive ? "Deactivate Design Mode" : "Activate Design Mode"}
         >
            <Pencil className="h-4 w-4" />
         </Button>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-muted/40 p-1">
          <SandpackFileExplorer />
        </aside>
        <main className="flex-1 flex flex-col">
          <Tabs value={tab} onValueChange={v => setTab(v as 'code' | 'design')} className="flex-1 flex flex-col">
            <TabsList className="border-b bg-background px-4 py-2">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="design" disabled={parsingStatus !== 'ready'}>
                Design {parsingStatus === 'parsing' ? '(Parsing...)' : ''} {parsingStatus === 'error' ? '(Error)' : ''}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="code" className="flex-1 overflow-hidden m-0 p-0">
              <InstanceEditor />
            </TabsContent>
            <TabsContent value="design" className="flex-1 flex flex-col p-0 m-0">
              <div className="flex-1 h-full relative">
                <SandpackPreviewWrapper 
                  ref={previewWrapperRef} 
                  showOpenInCodeSandbox={false} 
                  className="h-full" 
                />
                {/* Inspector Panel - Show only if design mode is active AND node is selected */}
                {isDesignModeActive && selectedNode && (
                  <div className="absolute top-12 right-2 w-72 max-h-[80%] bg-background border rounded-lg shadow-lg overflow-auto z-10">
                    <Inspector selectedNode={selectedNode} />
                  </div>
                )}
                {/* Initial message when design tab is ready but mode is off */}
                {parsingStatus === 'ready' && !isDesignModeActive && (
                   <div className="absolute top-12 right-2 w-72 bg-background border rounded-lg shadow-lg p-4 z-10 text-sm text-muted-foreground">
                     Activate Design Mode ( <Pencil className="inline h-3 w-3" /> ) to inspect elements.
                   </div>
                )}
                {/* Error message */}
                {parsingStatus === 'error' && (
                   <div className="absolute top-12 right-2 w-72 bg-background border rounded-lg shadow-lg p-4 z-10 text-sm text-muted-foreground text-red-500">
                     AST parsing failed. Cannot inspect.
                   </div>
                )}
              </div>
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

// Path for the listener script *within* the Sandpack VFS
const PREVIEW_LISTENER_SCRIPT_VFS_PATH = '/sandpack-injected-utils/preview-listener.js';

// Content of the listener script - Restored logic + Prevent Default
const PREVIEW_LISTENER_SCRIPT_CONTENT = `
let hoverOverlay = null;
let isHostDesignModeActive = false;

function createHoverOverlay() {
  if (!hoverOverlay) {
    hoverOverlay = document.createElement('div');
    hoverOverlay.style.position = 'absolute';
    hoverOverlay.style.border = '2px solid blue';
    hoverOverlay.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
    hoverOverlay.style.borderRadius = '3px';
    hoverOverlay.style.pointerEvents = 'none';
    hoverOverlay.style.zIndex = '9998';
    hoverOverlay.style.display = 'none';
    document.body.appendChild(hoverOverlay);
    console.log('[HappyPlace Preview] Created hover overlay.');
  }
}

function updateHoverOverlay(element) {
  if (!hoverOverlay || !element) {
    if (hoverOverlay) hoverOverlay.style.display = 'none';
    return;
  }
  const rect = element.getBoundingClientRect();
  hoverOverlay.style.left = (rect.left + window.scrollX) + 'px';
  hoverOverlay.style.top = (rect.top + window.scrollY) + 'px';
  hoverOverlay.style.width = rect.width + 'px';
  hoverOverlay.style.height = rect.height + 'px';
  hoverOverlay.style.display = 'block';
}

function hideHoverOverlay() {
  if (hoverOverlay) {
    hoverOverlay.style.display = 'none';
  }
}

function findElementWithUid(startElement) {
    let targetElement = startElement;
    while (targetElement && targetElement !== document.body) {
      if (targetElement.hasAttribute('data-uid')) {
        return targetElement;
      }
      targetElement = targetElement.parentElement;
    }
    return null;
}

window.addEventListener('message', function(event) {
  if (event.source !== window.parent) return;
  const message = event.data;
  if (message && message.type === 'happyplace-set-design-mode') {
    const wasActive = isHostDesignModeActive;
    isHostDesignModeActive = !!message.active;
    console.log('[HappyPlace Preview] Design mode set to: ' + isHostDesignModeActive);
    if (wasActive && !isHostDesignModeActive) {
       hideHoverOverlay();
    }
  }
});

function initializePreviewListeners() {
  console.log('[HappyPlace Preview] Initializing listeners...');
  createHoverOverlay();

  document.body.addEventListener('click', function(event) {
    if (!isHostDesignModeActive) return; // Only intercept clicks if host design mode is active
    
    if (!event.target || !(event.target instanceof Element)) return;
    const targetElement = findElementWithUid(event.target);
    
    if (targetElement) {
      // Found an element with UID while design mode is active
      const uid = targetElement.getAttribute('data-uid');
      console.log('[HappyPlace Preview] Intercepted click on UID: ' + uid + ' (Design Mode Active)');
      
      // --- Prevent Default Action and Stop Propagation --- //
      event.preventDefault();
      event.stopPropagation();
      // -------------------------------------------------- //
      
      // Still send the UID to the host for inspection
      window.parent.postMessage({ type: 'happyplace-select-uid', uid: uid }, '*');
    } 
    // If no element with UID was clicked, let the event proceed normally
  }, true); // Use capture phase to intercept early

  let lastHoveredElement = null;
  document.body.addEventListener('mouseover', function(event) {
    if (!isHostDesignModeActive) return;
     if (!event.target || !(event.target instanceof Element)) return;
     const targetElementWithUid = findElementWithUid(event.target);
     if (targetElementWithUid && targetElementWithUid !== lastHoveredElement) {
       console.log('[HappyPlace Preview] Hovering element with UID: ' + targetElementWithUid.getAttribute('data-uid')); // Debug log
       updateHoverOverlay(targetElementWithUid);
       lastHoveredElement = targetElementWithUid;
     } else if (!targetElementWithUid && lastHoveredElement) {
        // If moving from a UID element to one without, hide overlay
        // hideHoverOverlay(); // Optional: hide immediately if moving off a UID element
        // lastHoveredElement = null;
     }
  });

  document.body.addEventListener('mouseout', function(event) {
    if (lastHoveredElement && event.relatedTarget instanceof Element) {
        if (!lastHoveredElement.contains(event.relatedTarget) || !findElementWithUid(event.relatedTarget)) {
             hideHoverOverlay();
             lastHoveredElement = null;
        }
    } else if (!event.relatedTarget) { 
        hideHoverOverlay();
        lastHoveredElement = null;
    }
  });

  console.log('[HappyPlace Preview] Listeners attached.');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePreviewListeners);
} else {
  initializePreviewListeners();
}
`;

// Helper to get relative path (basic version)
function getRelativePath(fromPath: string, toPath: string): string {
  const fromParts = fromPath.split('/').filter(Boolean);
  const toParts = toPath.split('/').filter(Boolean);

  // Remove filename from 'from' path
  fromParts.pop();

  let commonPrefix = 0;
  while (
    commonPrefix < fromParts.length &&
    commonPrefix < toParts.length &&
    fromParts[commonPrefix] === toParts[commonPrefix]
  ) {
    commonPrefix++;
  }

  const upLevels = fromParts.length - commonPrefix;
  const downLevels = toParts.slice(commonPrefix);

  const relativePath = [
    ...Array(upLevels).fill('..'),
    ...downLevels
  ].join('/');

  // Ensure it starts with ./ or ../ if necessary
  return fromParts.length === 0 || upLevels > 0 ? relativePath : './' + relativePath;
}

// --- New Setup Component ---
interface SandpackSetupProps {
  originalFiles: SandpackFiles;
  template: DetectedSandpackTemplate;
}

function SandpackSetup({ originalFiles, template }: SandpackSetupProps) {
  const { 
    astMap, 
    uidToAstNodeMap, 
    instrumentedCodeMap, 
    parsingStatus, 
    error: astError 
  } = useAstRegistry(originalFiles);

  useEffect(() => {
    if (parsingStatus === 'ready' && astMap) {
      console.log(`[Setup] AST Map size: ${astMap.size}, UID Map size: ${uidToAstNodeMap.size}`);
    }
  }, [astMap, uidToAstNodeMap, parsingStatus]);

  // Construct the final files for Sandpack once AST processing is ready
  const finalSandpackFiles = useMemo(() => {
    if (parsingStatus !== 'ready' || !instrumentedCodeMap) {
      return null; 
    }
    console.log("[Setup] AST ready. Constructing final Sandpack files...");

    const finalFiles: SandpackFiles = {};
    let entryPointPath: string | undefined;
    let finalActiveFilePath: string | undefined;

    // Add instrumented code first
    instrumentedCodeMap.forEach((code, filename) => {
      const originalFile = originalFiles[filename];
      const isHidden = typeof originalFile === 'object' && originalFile !== null && !!originalFile.hidden;
      finalFiles[filename] = { code: code, hidden: isHidden }; // Ensure object format
    });

    // Add non-instrumented files 
    for (const filename in originalFiles) {
      if (!instrumentedCodeMap.has(filename)) {
        finalFiles[filename] = originalFiles[filename];
      }
    }

    // Add listener script content
    finalFiles[PREVIEW_LISTENER_SCRIPT_VFS_PATH] = {
      code: PREVIEW_LISTENER_SCRIPT_CONTENT,
      hidden: true,
    };

    // Find entry point (using same logic as before)
    const preferredEntryPoints = [
      '/src/main.tsx', '/src/main.jsx', '/src/main.js',
      '/src/index.tsx', '/src/index.jsx', '/src/index.js',
      '/pages/index.tsx', '/pages/index.js', // Next.js pages router
      '/app/page.tsx', // Next.js app router
      '/index.tsx', '/index.jsx', '/index.js',
      '/src/App.tsx', '/src/App.jsx', '/src/App.js',
      '/App.tsx', '/App.jsx', '/App.js', 
    ];
    entryPointPath = preferredEntryPoints.find(p => finalFiles[p]);
    finalActiveFilePath = entryPointPath;
    if (!entryPointPath) {
       console.warn("[Setup] Could not find a preferred entry point. Falling back...");
       entryPointPath = Object.keys(finalFiles).find(f => 
          /\.(t|j)sx?$/.test(f) && !f.includes('/sandpack-injected-utils/') &&
          !f.includes('/utils/') && !f.includes('/lib/') && !f.includes('config') && 
          !f.includes('test') && !f.includes('setup') && !f.includes('vite-env') &&
          !f.includes('shims')
       );
       finalActiveFilePath = entryPointPath; 
       console.warn(`[Setup] Fallback entry point guess: ${entryPointPath}`);
    }

    // Inject relative import
    if (entryPointPath && finalFiles[entryPointPath]) {
      const relativeImportPath = getRelativePath(entryPointPath, PREVIEW_LISTENER_SCRIPT_VFS_PATH);
      const entryFile = finalFiles[entryPointPath];
      if (typeof entryFile === 'object' && entryFile !== null) {
        const entryPointContent = entryFile.code;
        const importStatement = `import '${relativeImportPath}';`;
        
        if (!entryPointContent.includes(relativeImportPath)) {
          const newCode = `${importStatement}\n${entryPointContent}`;
          // --- LOGGING FOR DEBUG --- 
          console.log(`[Setup] Injecting import into ${entryPointPath}`);
          console.log(`[Setup] Relative path: ${relativeImportPath}`);
          console.log(`[Setup] First 100 chars BEFORE: ${entryPointContent.substring(0, 100)}`); 
          console.log(`[Setup] First 100 chars AFTER: ${newCode.substring(0, 100)}`); 
          // --- END LOGGING ---
          finalFiles[entryPointPath] = { ...entryFile, code: newCode }; 
          console.log(`[Setup] Injection complete for ${entryPointPath}.`);
        } else {
           console.log(`[Setup] Listener import already present in: ${entryPointPath}`);
        }
      } else {
         console.error(`[Setup] Entry point file ${entryPointPath} is not an object, cannot inject listener.`);
      }
    } else {
      console.error("[Setup] CRITICAL: Could not inject listener. Clicks won't work.");
      finalActiveFilePath = Object.keys(finalFiles).find(k => /.(t|j)sx?$/.test(k) || k.endsWith('.html') && k !== PREVIEW_LISTENER_SCRIPT_VFS_PATH);
    }

    return { 
        files: finalFiles, 
        activeFile: finalActiveFilePath || '/index.html' 
    };

  }, [parsingStatus, instrumentedCodeMap, originalFiles]);

  // Display loading/error state during AST processing
  if (parsingStatus === 'idle' || parsingStatus === 'parsing') {
     return <div className="flex h-screen items-center justify-center">Processing Code for Design Mode...</div>;
  }

  if (parsingStatus === 'error' || !finalSandpackFiles) {
     return <div className="flex h-screen items-center justify-center text-red-500">Error preparing design mode: {astError?.message || 'Failed to process code.'}</div>;
  }
  
  // Pass the generated map and status down as props
  return (
    <SandpackProvider 
      template={template}
      files={finalSandpackFiles.files} 
      theme="dark"
      options={{ 
        skipEval: false, 
        activeFile: finalSandpackFiles.activeFile 
      }}
    >
      <SandpackLayoutAndAst 
        initialTab="code" 
        uidToAstNodeMap={uidToAstNodeMap} // Pass the map
        parsingStatus={parsingStatus}     // Pass status
        astError={astError}               // Pass error
      /> 
    </SandpackProvider>
  );
}

export default function InstancePage(props: InstancePageProps) {
  const params = use(props.params);
  
  // State for original fetched data
  const [originalFiles, setOriginalFiles] = useState<SandpackFiles | null>(null);
  const [template, setTemplate] = useState<DetectedSandpackTemplate>('static');
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingFiles(true);
    setFileError(null);
    setOriginalFiles(null); // Clear previous state

    const parts = params.id.split('___');
    let owner: string | undefined;
    let repo: string | undefined;

    if (parts.length === 2) {
      owner = parts[0];
      repo = parts[1];
    } else {
      setFileError("Invalid instance ID format.");
      setIsLoadingFiles(false);
      setOriginalFiles(null);
      return;
    }

    if (!owner || !repo) {
      setFileError("Invalid owner or repo.");
      setIsLoadingFiles(false);
      setOriginalFiles(null);
      return;
    }

    console.log(`Fetching files for ${owner}/${repo}...`);
    fetchRepoDataForSandpack(owner, repo)
      .then(({ files: fetchedFiles, template: detectedTemplate }) => {
        console.log(`GitHub files fetched successfully. Template: ${detectedTemplate}`);
        setOriginalFiles(fetchedFiles);
        setTemplate(detectedTemplate || 'static');
      })
      .catch(err => {
        console.error("Error fetching instance files:", err);
        const message = err instanceof Error ? err.message : String(err);
        setFileError(`Failed to load repository files: ${message}`);
        setOriginalFiles(null);
      })
      .finally(() => {
        setIsLoadingFiles(false);
      });
  }, [params.id]);

  if (isLoadingFiles) {
    return <div className="flex h-screen items-center justify-center">Loading Repository Files...</div>;
  }

  if (fileError) {
    return <div className="flex h-screen items-center justify-center text-red-500">Error: {fileError}</div>;
  }

  if (!originalFiles) {
     return <div className="flex h-screen items-center justify-center text-red-500">Error: Could not load files.</div>;
  }

  // Render the setup component which handles AST processing and SandpackProvider
  return (
    <SandpackSetup 
      originalFiles={originalFiles} 
      template={template} 
    />
  );
} 