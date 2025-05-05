import * as babelParser from '@babel/parser';
import { File } from '@babel/types';

export function parseCode(code: string, filename?: string): File {
  try {
    const ast = babelParser.parse(code, {
      sourceType: 'module', // Assume module code by default
      sourceFilename: filename,
      plugins: [
        'jsx',
        'typescript',
        // Add other plugins based on potential future needs or detected syntax
        // e.g., 'decorators', 'classProperties' if needed and configured
      ],
      errorRecovery: true, // Attempt to recover from minor syntax errors
      attachComment: false, // Improves performance, comments not needed for analysis
      ranges: true, // Keep range info for potential mapping later
      tokens: false, // Don't need tokens for this use case
    });

    // TODO: Handle parse errors stored in ast.errors if errorRecovery is true
    if (ast.errors && ast.errors.length > 0) {
      console.warn(`Encountered ${ast.errors.length} parsing errors in ${filename || 'code snippet'}:`, ast.errors);
      // Potentially throw a custom error or handle specific error types
    }

    return ast;
  } catch (error) {
    console.error(`Failed to parse ${filename || 'code snippet'}:`, error);
    // Rethrow or handle the error appropriately
    throw error;
  }
} 