import { FileSystemTree, FileNode, DirectoryNode, SymlinkNode } from '@webcontainer/api';
import { GitHubFile } from '@/lib/github/repo'; // Assuming GitHubFile type is exported here

// Define the possible node types from FileSystemTree values
type FsTreeNode = DirectoryNode | FileNode | SymlinkNode;

// Type guard to check if a node is a DirectoryNode
function isDirectoryNode(node: FsTreeNode | undefined): node is DirectoryNode {
  // Check if node is defined and has the 'directory' property
  return typeof node === 'object' && node !== null && 'directory' in node;
}

/**
 * Converts a flat list of GitHub file objects (with full paths)
 * into a nested FileSystemTree structure required by WebContainer.
 *
 * @param files - Array of GitHubFile objects.
 * @param basePath - Optional base path to strip from file paths (e.g., 'src/').
 * @returns A FileSystemTree object.
 */
export function convertGitHubFilesToFsTree(
  files: GitHubFile[],
  basePath: string = ''
): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const file of files) {
    // Skip items without paths or with undefined content for blobs
    if (!file.path || (file.type === 'blob' && file.content === undefined)) {
      console.warn('Skipping file due to missing path or content:', file);
      continue;
    }

    let currentLevel = tree;
    // Adjust path relative to basePath if provided
    const relativePath = basePath && file.path.startsWith(basePath)
      ? file.path.substring(basePath.length)
      : file.path;
      
    const pathParts = relativePath.split('/').filter(part => part !== ''); // Remove empty parts

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLastPart = i === pathParts.length - 1;

      if (isLastPart) {
        if (file.type === 'blob') {
          // Type assertion for file contents
          currentLevel[part] = {
            file: {
              contents: file.content as string | Uint8Array,
            },
          } as FileNode; // Assert the node type
        } else if (file.type === 'tree') {
          if (!currentLevel[part]) {
            currentLevel[part] = {
              directory: {},
            };
          } // else: Node exists, could be file/dir, don't overwrite
        } else {
          console.warn(`Skipping unsupported GitHub item type: ${file.type} for path: ${file.path}`);
        }
      } else {
        // Intermediate directory logic
        const existingNode = currentLevel[part];

        if (!existingNode) {
          // Create directory node if it doesn't exist
          const newDirNode: DirectoryNode = { directory: {} };
          currentLevel[part] = newDirNode;
          currentLevel = newDirNode.directory; // Safe access after creation
        } else if (isDirectoryNode(existingNode)) {
          // Node exists and is a directory, move into it
          currentLevel = existingNode.directory; // Safe access via type guard
        } else {
          // Node exists but is not a directory (it's a file or symlink)
          console.error(`Path conflict: Trying to create directory '${part}' but a non-directory node already exists.`);
          break; // Stop processing this file path
        }
      }
    }
  }

  return tree;
} 