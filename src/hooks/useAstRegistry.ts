import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { parseCode } from '../lib/ast/parser';
import { instrumentCode, UidToAstNodeMap } from '../lib/ast/instrumentation';
import generate from '@babel/generator';
import type { SandpackFiles } from '@codesandbox/sandpack-react';
import type { File } from '@babel/types';

// Export the type
export type ParsingStatus = 'idle' | 'parsing' | 'ready' | 'error';

export interface AstRegistry {
  astMap: Map<string, File>;
  uidToAstNodeMap: UidToAstNodeMap;
  instrumentedCodeMap: Map<string, string>;
  parsingStatus: ParsingStatus;
  error: Error | null;
}

const DEBOUNCE_DELAY = 500; // ms

/**
 * Manages a registry of Babel ASTs and UID-to-Node maps for Sandpack files.
 * Parses and instruments code on file changes (debounced).
 */
export function useAstRegistry(files: SandpackFiles | null): AstRegistry {
  const [astMap, setAstMap] = useState<Map<string, File>>(new Map());
  const [uidToAstNodeMap, setUidToAstNodeMap] = useState<UidToAstNodeMap>(new Map());
  const [instrumentedCodeMap, setInstrumentedCodeMap] = useState<Map<string, string>>(new Map());
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  // --- File Discovery --- (P3-05)
  const discoverSourceFiles = useCallback((currentFiles: SandpackFiles): Record<string, string> => {
    const sourceFiles: Record<string, string> = {};
    for (const filename in currentFiles) {
      // Basic filter for likely source files - adjust extensions as needed
      if (/\.tsx?$|\.jsx?$/.test(filename)) {
        const fileContent = currentFiles[filename];
        if (typeof fileContent === 'string') {
            sourceFiles[filename] = fileContent;
        } else if (typeof fileContent?.code === 'string') {
            sourceFiles[filename] = fileContent.code;
        }
      }
    }
    return sourceFiles;
  }, []);

  // --- Parsing and Instrumentation Logic --- (P3-02, P3-06, P3-07, P3-08)
  const processFiles = useDebouncedCallback(async (currentFiles: SandpackFiles) => {
    setParsingStatus('parsing');
    setError(null);
    console.log('[useAstRegistry] Starting parse/instrumentation/codegen...');

    try {
      const sourceFilesToProcess = discoverSourceFiles(currentFiles);
      const newAstMap = new Map<string, File>();
      const newUidToAstNodeMap: UidToAstNodeMap = new Map();
      const newInstrumentedCodeMap = new Map<string, string>();

      for (const filename in sourceFilesToProcess) {
        const code = sourceFilesToProcess[filename];
        let generatedCode = code;
        try {
          const rawAst = parseCode(code, filename);
          const { instrumentedAst, uidToAstNodeMap: fileUidMap } = instrumentCode(rawAst);

          try {
            const output = generate(instrumentedAst, { /* options if needed */ });
            generatedCode = output.code;
          } catch (genError: unknown) { 
            console.error(`[useAstRegistry] Error generating code for ${filename}:`, genError);
          }

          newAstMap.set(filename, instrumentedAst);
          fileUidMap.forEach((node, uid) => newUidToAstNodeMap.set(uid, node));
        } catch (err: unknown) {
            if (err instanceof Error) {
              console.error(`[useAstRegistry] Error processing file ${filename}:`, err.message, err.stack);
            } else {
              console.error(`[useAstRegistry] Error processing file ${filename}:`, err);
            }
        }
        newInstrumentedCodeMap.set(filename, generatedCode);
      }

      setAstMap(newAstMap);
      setUidToAstNodeMap(newUidToAstNodeMap);
      setInstrumentedCodeMap(newInstrumentedCodeMap);
      setParsingStatus('ready');
      console.log(`[useAstRegistry] Processing complete. ${newAstMap.size} ASTs processed, ${newInstrumentedCodeMap.size} code outputs generated, ${newUidToAstNodeMap.size} UIDs mapped.`);

    } catch (err: unknown) {
      console.error('[useAstRegistry] Failed to process files:', err);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(new Error(String(err)));
      }
      setParsingStatus('error');
      setAstMap(new Map());
      setUidToAstNodeMap(new Map());
      setInstrumentedCodeMap(new Map());
    }
  }, DEBOUNCE_DELAY);

  // --- Effect to Trigger Processing --- (P3-08)
  useEffect(() => {
    if (files && Object.keys(files).length > 0) {
        console.log('[useAstRegistry] Files changed, triggering processing...');
        processFiles(files);
    } else {
        setAstMap(new Map());
        setUidToAstNodeMap(new Map());
        setInstrumentedCodeMap(new Map());
        setParsingStatus('idle');
        setError(null);
    }

    // Cleanup function for the debounced callback
    return () => {
        processFiles.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, processFiles]); // processFiles depends on discoverSourceFiles, which is stable

  return { astMap, uidToAstNodeMap, instrumentedCodeMap, parsingStatus, error };
} 