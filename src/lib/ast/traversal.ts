import { WebContainer } from '@webcontainer/api';
import path from 'path'; // path-browserify or similar should be available

// Supported file extensions for AST parsing
const SUPPORTED_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

/**
 * Recursively discovers source files within a given directory in the WebContainer's VFS.
 *
 * @param webContainerInstance The active WebContainer instance.
 * @param directoryPath The starting directory path within the WebContainer (e.g., '/project/src').
 * @param fileList An array to accumulate the found file paths (used internally for recursion).
 * @returns A promise resolving to an array of full paths to supported source files.
 */
export async function discoverSourceFiles(
  webContainerInstance: WebContainer,
  directoryPath: string,
  fileList: string[] = []
): Promise<string[]> {
  try {
    const entries = await webContainerInstance.fs.readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        // Avoid node_modules and other common non-source directories
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          await discoverSourceFiles(webContainerInstance, fullPath, fileList);
        }
      } else if (entry.isFile()) {
        const fileExtension = path.extname(entry.name);
        if (SUPPORTED_EXTENSIONS.has(fileExtension)) {
          fileList.push(fullPath);
        }
      }
      // Ignore other entry types like symlinks for now
    }
  } catch (error: unknown) {
    // Log errors like permission denied or directory not found, but continue if possible
    if (error instanceof Error) {
        console.warn(`Error reading directory ${directoryPath}: ${error.message}`);
    } else {
        console.warn(`An unknown error occurred while reading directory ${directoryPath}:`, error);
    }
  }

  return fileList;
} 