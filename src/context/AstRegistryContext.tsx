'use client'; // Add the client directive

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { WebContainer, IFSWatcher, WebContainerProcess } from '@webcontainer/api';
import { Tree } from 'web-tree-sitter';
import { useWebContainerContext } from '../context/WebContainerContext'; // Import the context hook
import { useFileSystem, FileChangeEvent } from '../hooks/useFileSystem'; // Import useFileSystem and FileChangeEvent
import { discoverSourceFiles } from '../lib/ast/traversal';
import { parseSource, initializeParser } from '../lib/ast/parser';
import { readFile as readFsFile } from '../lib/container/filesystem'; // Renamed import
import { generateComponentMaps } from '../lib/ast/componentMapGenerator'; // Import map generator
import { updatePreviewComponentMap } from '../lib/preview/setup'; // Import setup function
import path from 'path'; // path-browserify needed for extname, join

// Interface for controls returned by the setup process
interface PreviewEnvironmentControls {
  stop: () => Promise<void>;
}

// Define a more specific type for the watcher that includes dispose
interface DisposableWatcher extends IFSWatcher {
  dispose?: () => void;
}

export interface AstRegistryContextType {
  astRegistry: Map<string, Tree>;
  componentMap: Map<string, string>;
  inverseMap: Map<string, string>;
  isLoading: boolean;
  error: Error | null;
  refreshRegistry: () => Promise<void>;
  isPreviewAppSetup: boolean;
  isPreviewServerRunning: boolean;
  previewUrl: string | null; // <-- Add previewUrl
}

export const AstRegistryContext = createContext<AstRegistryContextType | undefined>(
  undefined
);

interface AstRegistryProviderProps {
  children: ReactNode;
  projectRoot?: string;
}

// Helper to check if a path is a supported source file
const isSupportedSourceFile = (filePath: string): boolean => {
  const ext = path.extname(filePath);
  return ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
};

export const AstRegistryProvider: React.FC<AstRegistryProviderProps> = ({ children, projectRoot = '/sandbox/user-project' }) => {
  // Get instance and MOUNTED state (indicates user project is mounted)
  const { webcontainerInstance, isMounted: isUserProjectMounted /*, isLoading: isWebContainerLoading */ } = useWebContainerContext(); 
  const { watchDirectory } = useFileSystem();
  const [astRegistry, setAstRegistry] = useState<Map<string, Tree>>(new Map());
  const [componentMap, setComponentMap] = useState<Map<string, string>>(new Map());
  const [inverseMap, setInverseMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPreviewAppSetup, setIsPreviewAppSetup] = useState<boolean>(false); // Tracks if preview *environment* is set up
  const [isPreviewServerRunning, setIsPreviewServerRunning] = useState<boolean>(false); // Tracks if dev server process is active
  const watcherSubscription = useRef<DisposableWatcher | null>(null);
  const previewSetupRef = useRef<{ controls: PreviewEnvironmentControls | null, isRunning: boolean }>({ controls: null, isRunning: false });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // <-- Add state for URL

  // --- *** NEW Effect for Dynamic Preview Environment Setup *** ---
  useEffect(() => {
    // Run only when user project is mounted and setup isn't already running/complete
    if (webcontainerInstance && isUserProjectMounted && !isPreviewAppSetup && !previewSetupRef.current.isRunning) {
      console.log("ASTRegistryContext: User project mounted, starting dynamic preview environment setup...");
      previewSetupRef.current.isRunning = true;
      setIsPreviewAppSetup(false);
      setIsPreviewServerRunning(false);
      setError(null);
      setPreviewUrl(null);

      const initializePreviewEnvironment = async (instance: WebContainer): Promise<PreviewEnvironmentControls> => {
        let setupError: Error | null = null;
        let viteCreateProcess: WebContainerProcess | null = null;
        let npmInstallProcess: WebContainerProcess | null = null;
        let npmRunDevProcess: WebContainerProcess | null = null;
        let unsubscribeServerReady: (() => void) | null = null;
        const previewDir = '/sandbox/preview-app';
        const vitePort = 5174;

        const cleanup = async () => {
          console.log("ASTRegistryContext: Cleaning up preview environment processes...");
          unsubscribeServerReady?.();
          // Use optional chaining and null checks
          if (npmRunDevProcess) { 
            console.log("Killing npm run dev process...");
            npmRunDevProcess.kill(); 
            try { await npmRunDevProcess.exit; } catch { /* ignore exit error */ }
            npmRunDevProcess = null;
          }
          if (npmInstallProcess) { 
            console.log("Killing npm install process...");
            npmInstallProcess.kill(); 
            try { await npmInstallProcess.exit; } catch { /* ignore exit error */ }
            npmInstallProcess = null;
          }
          if (viteCreateProcess) {
             console.log("Killing vite create process...");
             viteCreateProcess.kill();
             try { await viteCreateProcess.exit; } catch { /* ignore exit error */ }
             viteCreateProcess = null;
          }
        };

        try {
          // 1. Create Vite App using npx
          console.log(`Running npx create-vite ${previewDir}...`);
          // Pass -y flag to npx itself to auto-confirm package download
          viteCreateProcess = await instance.spawn('npx', [
            '-y', // Re-add -y flag for npx
            'create-vite@latest', 
            previewDir, 
            '--template', 
            'react-ts'
          ]);
          viteCreateProcess.output.pipeTo(new WritableStream({ write(data) { console.log(`[create-vite]: ${data}`); } })).catch(console.error);
          const createExitCode = await viteCreateProcess.exit;
          if (createExitCode !== 0) throw new Error(`create-vite failed with exit code ${createExitCode}`);
          console.log('create-vite completed successfully.');

          // 2. Modify vite.config.ts
          console.log(`Modifying ${previewDir}/vite.config.ts...`);
          const viteConfigPath = `${previewDir}/vite.config.ts`;
          const originalConfig = await instance.fs.readFile(viteConfigPath, 'utf-8');
          // Very basic modification - might need more robust parsing/editing
          let modifiedConfig = originalConfig;

          // Define Aliases needed - Both @user-project and @
          const userProjectAliasTarget = `${previewDir}/node_modules/@user-project`; 
          const internalAliasTarget = `${userProjectAliasTarget}/frontend/src`; 
          const aliasObjectString = `{ '@user-project': '${userProjectAliasTarget}', '@': '${internalAliasTarget}' }`;
          const resolveBlockString = `\n  resolve: {\n    alias: ${aliasObjectString}\n  },`;
          
          // Define server.fs.allow list - Use relative path '.' from cwd?
          const allowList = `[ '.' ]`; // Allow relative from cwd (/sandbox/preview-app)
          const serverFsAllowString = `fs: { allow: ${allowList} }`;
          const serverBlockString = `\n  server: {\n    ${serverFsAllowString}\n  },`;

          // --- Injection Logic --- 
          // Add/Update resolve block for BOTH aliases
          if (/resolve:\s*{/.test(modifiedConfig)) {
            if (!modifiedConfig.includes(aliasObjectString)) {
                 console.log('Updating aliases in existing resolve block...');
                 modifiedConfig = modifiedConfig.replace(/alias:\s*{[^}]*}/, `alias: ${aliasObjectString}`); 
            } else { console.log('Aliases already seem correct in resolve block.'); }
          } else {
            console.log('Inserting new resolve block for aliases...');
            if (/\n\s*plugins:/.test(modifiedConfig)) {
               modifiedConfig = modifiedConfig.replace(/(\n\s*plugins:)/, `${resolveBlockString}$1`);
            } else { modifiedConfig = modifiedConfig.replace(/(\n}\);)/, `${resolveBlockString}$1`); }
          }
          
          // Add/Update server block for relative fs.allow
           if (/server:\s*{/.test(modifiedConfig)) {
               if (!/fs:\s*{/.test(modifiedConfig)) {
                   console.log('Injecting fs block with relative allow list...');
                   modifiedConfig = modifiedConfig.replace(/(server:\s*{\s*)/, `$1${serverFsAllowString},\n    `);
               } else {
                   console.log('Replacing existing fs.allow list with relative version...');
                   modifiedConfig = modifiedConfig.replace(/allow:\s*\[[^\]]*\]/, `allow: ${allowList}`); 
               } 
           } else {
                console.log('Inserting new server block with relative fs.allow...');
                 if (/\n\s*plugins:/.test(modifiedConfig)) {
                   modifiedConfig = modifiedConfig.replace(/(\n\s*plugins:)/, `${serverBlockString}$1`);
                } else { modifiedConfig = modifiedConfig.replace(/(\n}\);)/, `${serverBlockString}$1`); }
           }

           // Remove optimizeDeps block (remains same)
           modifiedConfig = modifiedConfig.replace(/\n\s*optimizeDeps:\s*{[^}]*},?/, '');

          await instance.fs.writeFile(viteConfigPath, modifiedConfig);
          console.log('vite.config.ts modification attempted (restored aliases, relative allow).');
          // --- End Modify Step ---

          // 3. Install Dependencies
          console.log(`Running npm install in ${previewDir}...`);
          npmInstallProcess = await instance.spawn('npm', ['install'], { cwd: previewDir });
          npmInstallProcess.output.pipeTo(new WritableStream({ write(data) { console.log(`[npm install]: ${data}`); } })).catch(console.error);
          const installExitCode = await npmInstallProcess.exit;
          if (installExitCode !== 0) throw new Error(`npm install failed with exit code ${installExitCode}`);
          console.log('npm install completed successfully.');
          
          // Optional verification (can be removed if causing issues)
          try {
             await instance.fs.readFile(`${previewDir}/node_modules/react/package.json`);
             console.log('node_modules verification successful.');
          } catch { 
             console.warn('node_modules verification failed (continuing anyway).') 
          }

          setIsPreviewAppSetup(true); // Mark environment setup as complete HERE

          // 4. Start Dev Server
          console.log(`Running npm run dev in ${previewDir}...`);
          npmRunDevProcess = await instance.spawn('npm', ['run', 'dev', '--', '--port', String(vitePort), '--host'], { cwd: previewDir });
          npmRunDevProcess.output.pipeTo(new WritableStream({ write(data) { console.log(`[npm run dev]: ${data}`); } })).catch(console.error);
          setIsPreviewServerRunning(true); // Mark server as attempting to start

          // 5. Wait for server-ready
          await new Promise<void>((resolve, reject) => {
            let resolved = false;
            const timeoutId = setTimeout(() => {
              if (!resolved) {
                  cleanup();
                  reject(new Error(`Timeout waiting for preview server on port ${vitePort}.`));
              }
            }, 60000); // 60s timeout

            unsubscribeServerReady = instance.on('server-ready', (port, url) => {
              if (port === vitePort && !resolved) {
                  resolved = true;
                  clearTimeout(timeoutId);
                  console.log(`Preview server ready: ${url}`);
                  setPreviewUrl(url);
                  resolve(); 
              }
            });
            console.log(`Attached server-ready listener for port ${vitePort}`);

             // Handle server process exiting unexpectedly
             if (npmRunDevProcess) {
                 npmRunDevProcess.exit.then((exitCode: number) => {
                   setIsPreviewServerRunning(false); // Server stopped
                   unsubscribeServerReady?.(); // Clean up listener
                   unsubscribeServerReady = null;
                   if (!resolved && exitCode !== 0) {
                       clearTimeout(timeoutId);
                       reject(new Error(`Preview server process exited prematurely with code ${exitCode}`));
                   } else if (!resolved) {
                       clearTimeout(timeoutId);
                       reject(new Error(`Preview server process exited cleanly before signaling ready.`));
                   }
                 }).catch(reject); // Catch errors from the exit promise itself
             }
          });

        } catch (error) {
          console.error("Error initializing preview environment:", error);
          setupError = error instanceof Error ? error : new Error('Preview environment setup failed');
          await cleanup(); // Ensure cleanup on error
          throw setupError; // Re-throw to be caught outside
        }

        // Return controls including the cleanup function
        return { stop: cleanup };
      };

      initializePreviewEnvironment(webcontainerInstance)
        .then(controls => {
          console.log("Preview environment initialized successfully.");
          previewSetupRef.current.controls = controls;
          // States (isPreviewAppSetup, isPreviewServerRunning, previewUrl) are set within initializePreviewEnvironment
        })
        .catch(err => {
          console.error("ASTRegistryContext: Failed to initialize preview environment:", err);
          setError(err instanceof Error ? err : new Error('Failed to initialize preview environment'));
          setIsPreviewAppSetup(false);
          setIsPreviewServerRunning(false);
          setPreviewUrl(null);
          previewSetupRef.current.controls = null;
        })
        .finally(() => {
          previewSetupRef.current.isRunning = false;
        });

      // Return cleanup function for the *useEffect* hook itself
      return () => {
         console.log("ASTRegistryContext: Cleaning up preview environment due to effect re-run or unmount...");
         previewSetupRef.current.controls?.stop();
         previewSetupRef.current.controls = null;
         previewSetupRef.current.isRunning = false; // Reset running flag
      };
    }
  }, [webcontainerInstance, isUserProjectMounted, isPreviewAppSetup]); // Depend on user project mount status

  // --- Effect to Regenerate Maps & Update Preview Map File (Mostly Unchanged) ---
  useEffect(() => {
    if (astRegistry.size > 0 && webcontainerInstance && isPreviewAppSetup) { // Depends on preview *environment* setup now
      console.log("AST Registry updated, regenerating component maps...");
      try {
        const { componentMap: newComponentMap, inverseMap: newInverseMap } = generateComponentMaps(astRegistry);
        setComponentMap(newComponentMap);
        setInverseMap(newInverseMap);
        console.log(`Component maps regenerated: ${newComponentMap.size} components found.`);

        if (webcontainerInstance) {
          console.log("Updating preview app componentMap.js...");
          updatePreviewComponentMap(webcontainerInstance.fs, newComponentMap)
            .then(() => {
              console.log("Preview componentMap.js updated successfully.");
              setTimeout(() => {
                console.log("Posting componentMapUpdated message");
                window.postMessage({ type: 'componentMapUpdated' }, '*');
              }, 0); 
            })
            .catch(updateError => {
              console.error("Error updating preview component map file:", updateError);
            });
        }
      } catch (mapError) {
        console.error("Error generating component maps:", mapError);
        setError(prev => prev || (mapError instanceof Error ? mapError : new Error('Failed to generate component maps')));
      }
    } else if (astRegistry.size === 0 && componentMap.size > 0 && isPreviewAppSetup) { // Condition to clear map
        console.log("AST Registry empty, clearing component maps and updating file...");
        const emptyMap = new Map<string, string>();
        setComponentMap(emptyMap);
        setInverseMap(new Map<string, string>());
        if (webcontainerInstance) {
          updatePreviewComponentMap(webcontainerInstance.fs, emptyMap)
            .then(() => {
              console.log("Preview componentMap.js cleared.");
              setTimeout(() => {
                  console.log("Posting componentMapUpdated message (maps cleared)");
                  window.postMessage({ type: 'componentMapUpdated' }, '*');
              }, 0);
            })
            .catch(updateError => {
               console.error("Error clearing preview component map file:", updateError);
            });
        }
    }
  }, [astRegistry, webcontainerInstance, isPreviewAppSetup, componentMap.size]); // Added componentMap.size dependency

  // --- Initial File Parsing (Load and Parse) --- 
  const loadAndParseFiles = useCallback(async (instance: WebContainer) => {
    setIsLoading(true);
    setError(null);
    console.log('Initializing AST Registry...');

    try {
      await initializeParser();
      console.log('Tree-sitter parser initialized.');

      console.log(`Discovering source files in ${projectRoot}...`);
      const sourceFiles = await discoverSourceFiles(instance, projectRoot);
      console.log(`Found ${sourceFiles.length} source files.`);

      const newRegistry = new Map<string, Tree>();
      let processedCount = 0;

      for (const filePath of sourceFiles) {
        if (!isSupportedSourceFile(filePath)) continue; 
        try {
          const content = await readFsFile(instance, filePath, 'utf-8');
          const fileExtension = path.extname(filePath);
          const ast = await parseSource(content, fileExtension);
          if (ast) {
            newRegistry.set(filePath, ast);
          } else {
             console.warn(`Failed to parse file, skipping: ${filePath}`);
          }
          processedCount++;
          if (processedCount % 20 === 0 || processedCount === sourceFiles.length) {
             console.log(`Parsed ${processedCount}/${sourceFiles.length} files...`);
          }
        } catch (fileError: unknown) {
          console.error(`Error processing file ${filePath}:`, fileError);
        }
      }

      setAstRegistry(newRegistry);
      console.log(`AST Registry populated with ${newRegistry.size} trees.`);

    } catch (err: unknown) {
      console.error('Failed to initialize AST registry:', err);
      setError(err instanceof Error ? err : new Error('AST registry init failed'));
      setAstRegistry(new Map()); 
    } finally {
      setIsLoading(false);
    }
  }, [projectRoot]);

  // --- File Change Handler --- 
  const handleFileChange = useCallback(async (event: FileChangeEvent) => {
    if (!webcontainerInstance) return;

    const fullPath = path.join(projectRoot, event.filename); 
    console.log(`File Watcher Event: ${event.type} - ${fullPath}`);

    if (!isSupportedSourceFile(fullPath)) {
        return; 
    }

    if (event.type === 'delete' || event.type === 'rename') {
        setAstRegistry(prev => {
            const newMap = new Map(prev);
            if (newMap.delete(fullPath)) {
                console.log(`Removed AST from registry: ${fullPath}`);
            }
            return newMap;
        });
    } else if (event.type === 'change') {
        try {
            console.log(`Reparsing changed file: ${fullPath}`);
            const content = await readFsFile(webcontainerInstance, fullPath, 'utf-8');
            const fileExtension = path.extname(fullPath);
            const newAst = await parseSource(content, fileExtension);
            if (newAst) {
                setAstRegistry(prev => new Map(prev).set(fullPath, newAst));
                console.log(`Updated AST in registry: ${fullPath}`);
            } else {
                console.warn(`Failed to re-parse file, removing from registry: ${fullPath}`);
                 setAstRegistry(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(fullPath);
                    return newMap;
                });
            }
        } catch (err: unknown) {
            console.error(`Error processing file change for ${fullPath}:`, err);
            setAstRegistry(prev => {
                const newMap = new Map(prev);
                newMap.delete(fullPath);
                return newMap;
            });
        }
    }
  }, [webcontainerInstance, projectRoot]);

  // --- Initial Load Effect --- 
  useEffect(() => {
    // Trigger initial scan ONLY when user project is mounted
    if (webcontainerInstance && isUserProjectMounted) { 
      console.log("ASTRegistryContext: User project mounted, triggering initial loadAndParseFiles...");
      loadAndParseFiles(webcontainerInstance);
    } else {
      console.log(`ASTRegistryContext: Skipping initial parse. Instance: ${!!webcontainerInstance}, User Project Mounted: ${isUserProjectMounted}`);
    }
  }, [webcontainerInstance, isUserProjectMounted, loadAndParseFiles]); 

  // --- Watcher Setup Effect --- 
   useEffect(() => {
    let cleanupWatcher = () => {};
    if (webcontainerInstance && projectRoot && isUserProjectMounted) { // Ensure user project is mounted before watching
      console.log(`ASTRegistryContext: Instance available, setting up file watcher for: ${projectRoot}`);
      try {
         if (watcherSubscription.current) {
            console.log('ASTRegistryContext: Cleaned up previous file watcher before setting up new one.');
            watcherSubscription.current.dispose?.(); 
            watcherSubscription.current = null;
         }
        const watcher: DisposableWatcher = watchDirectory(projectRoot, handleFileChange);
        watcherSubscription.current = watcher;
        console.log(`ASTRegistryContext: File watcher active for ${projectRoot}`);

        cleanupWatcher = () => {
          if (watcherSubscription.current) {
            console.log(`ASTRegistryContext: Cleaning up file watcher for ${projectRoot}`);
            watcherSubscription.current.dispose?.();
            watcherSubscription.current = null;
          }
        };
      } catch (watchError) {
         console.error(`ASTRegistryContext: Failed to set up file watcher for ${projectRoot}:`, watchError);
         setError(prev => prev || (watchError instanceof Error ? watchError : new Error('Failed to setup file watcher')));
      }
    }
    return cleanupWatcher;
  }, [webcontainerInstance, projectRoot, watchDirectory, handleFileChange, isUserProjectMounted]); // Depends on user project mount

  // --- Refresh Registry Function (Unchanged) --- 
  const refreshRegistry = useCallback(async () => {
    if (webcontainerInstance) {
        console.log("Manual refresh requested...");
        await loadAndParseFiles(webcontainerInstance);
    } else {
        console.warn("Cannot refresh: WebContainer not ready.");
    }
  }, [webcontainerInstance, loadAndParseFiles]);

  const value = {
    astRegistry,
    componentMap,
    inverseMap,
    isLoading, // AST parsing loading state
    error,
    refreshRegistry,
    isPreviewAppSetup, // Tracks setup process
    isPreviewServerRunning, // Tracks if server process is active
    previewUrl, 
  };

  return (
    <AstRegistryContext.Provider value={value}>
      {children}
    </AstRegistryContext.Provider>
  );
};

// Keep useAstRegistry hook export here
export const useAstRegistry = () => {
  const context = useContext(AstRegistryContext);
  if (context === undefined) {
    throw new Error('useAstRegistry must be used within an AstRegistryProvider');
  }
  return context;
}; 