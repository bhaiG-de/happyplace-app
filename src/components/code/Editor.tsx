"use client";

import React from 'react';
// Import Editor and the necessary types
import Editor, { EditorProps } from "@monaco-editor/react";
import type * as monaco from 'monaco-editor'; // Import monaco types
// import { useTheme } from 'next-themes'; // Assuming you might add theme switching later

// Configure Monaco loader (optional, but good practice)
// You might need to copy the 'vs' folder from 'node_modules/monaco-editor/min/vs' to '/public/monaco-vs'
// loader.config({
//   paths: { vs: '/monaco-vs' } 
// });

// Extend EditorProps to explicitly include path if it's not already there
// (though it should be based on the type definition)
interface CodeEditorProps extends EditorProps {
  path?: string;
}

/**
 * A basic wrapper around the Monaco Editor component.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'plaintext',
  value = '',
  onChange,
  options,
  height = "60vh",
  theme = "vs-dark", // Keep theme prop
  path, // Explicitly accept the path prop
  ...rest // Pass other valid EditorProps down
}) => {
  // const { resolvedTheme } = useTheme(); // Example for theme integration

  // Define the handler with correct types
  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor, 
    monacoInstance: typeof monaco
  ) => {
    // Use _editor and _monacoInstance if not needed immediately to avoid lint errors
    console.log('Monaco editor mounted', editor, monacoInstance); 
    // You can store editor/monacoInstance in refs here if needed for external access
  };

  const finalOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    readOnly: options?.readOnly ?? false,
    minimap: { enabled: true, ...(options?.minimap) },
    fontSize: 14,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 10, ...(options?.padding) },
    ...options, // Allow overriding default options
  };

  return (
    <div className="border rounded-md overflow-hidden" style={{ height }}>
      <Editor
        height="100%"
        language={language}
        path={path} // Pass the path prop down
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme={theme} // Use the passed theme or default
        options={finalOptions}
        loading={<div>Loading Editor...</div>} 
        {...rest} // Pass down remaining props
      />
    </div>
  );
}; 